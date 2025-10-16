import { getIntegrationConfig } from '../config/integration';
import { authService } from './auth.service';

export interface PawfectFriendsUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatar?: string;   // can be file name or absolute url
  phone?: string;
  address?: string;
  preferences?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface ZIMUserProfile {
  userID: string;
  userName: string;
  userAvatarUrl?: string;
  memberNickname?: string;
  memberRole?: number;
  muteExpiredTime?: number;
  extendedData?: string;
  customStatus?: string;
}

class UserService {
  private config = getIntegrationConfig();

  /** ---------- simple cache ---------- */
  private userCache = new Map<string, { user: PawfectFriendsUser; ts: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5m

  /** ---------- local throttling & circuit breaker ---------- */
  private lastBatchAt = 0;
  private readonly BATCH_COOLDOWN = 15_000; // 15s
  private batchFailures = 0;
  private readonly MAX_FAIL = 5;
  private circuitUntil = 0; // timestamp to end breaker

  /** ---------- helpers ---------- */

  private isValidObjectId(id: string) {
    return typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
  }

  private now() {
    return Date.now();
  }

  private isCacheLive(ts: number) {
    return this.now() - ts < this.CACHE_TTL;
  }

  private getAuthHeaders = async () => {
    const token = authService.getAuthToken();
    if (!token) throw new Error('No auth token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    } as const;
  };

  /** Build avatar URL if BE only returns filename */
  private toAvatarUrl(input?: string): string | undefined {
    if (!input) return undefined;
    try {
      // absolute?
      const u = new URL(input);
      return u.href;
    } catch {
      // relative filename → prefix by BE /uploads
      return `${this.config.apiBaseUrl}/uploads/${input}`;
    }
  }

  /** Map PF role -> ZIM role */
  private mapRoleToZIM(role?: string): number {
    const r = (role || 'user').toLowerCase();
    if (r === 'admin') return 1;       // owner
    if (r === 'moderator' || r === 'staff') return 2; // admin
    return 0;                          // member
  }

  private cacheSet(user: PawfectFriendsUser) {
    this.userCache.set(user.id, { user, ts: this.now() });
  }

  private cacheGet(id: string): PawfectFriendsUser | null {
    const item = this.userCache.get(id);
    if (!item) return null;
    if (!this.isCacheLive(item.ts)) {
      this.userCache.delete(id);
      return null;
    }
    return item.user;
  }

  private sweepCache() {
    const t = this.now();
    for (const [k, v] of this.userCache.entries()) {
      if (t - v.ts > this.CACHE_TTL) this.userCache.delete(k);
    }
  }

  /** ---------- converters ---------- */

  convertToZIMUser(user: PawfectFriendsUser): ZIMUserProfile {
    // Handle both 'id' and '_id' fields from backend
    const userId = user.id || (user as any)._id;

    // Use standardized fallback hierarchy: displayName → fullName → firstName → email → userID
    const displayName = user.displayName ||
      (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}`.trim() : null) ||
      user.firstName ||
      user.email ||
      userId;

    return {
      userID: userId,
      userName: displayName,
      userAvatarUrl: this.toAvatarUrl(user.avatar),
      memberNickname: displayName, // Only affects display name in group, not user avatar
      memberRole: this.mapRoleToZIM(user.role),
      muteExpiredTime: 0,
      extendedData: JSON.stringify({
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        preferences: user.preferences,
        displayName: user.displayName,
        firstName: user.firstName,
        lastName: user.lastName,
      }),
      customStatus: user.role ?? 'user',
    };
  }

  /** ---------- single user ---------- */

  async getCurrentUserProfile(): Promise<PawfectFriendsUser | null> {
    try {
      const res = await fetch(`${this.config.apiBaseUrl}/users/profile`, {
        headers: await this.getAuthHeaders(),
      });
      if (!res.ok) return null;
      const data = await res.json();
      // normalize & cache
      const user: PawfectFriendsUser = data.data || data;
      this.cacheSet(user);
      return user;
    } catch (e) {
      console.error('getCurrentUserProfile error:', e);
      return null;
    }
  }

  async getUserProfileById(userId: string): Promise<PawfectFriendsUser | null> {
    try {
      const cached = this.cacheGet(userId);
      if (cached) return cached;

      const res = await fetch(`${this.config.apiBaseUrl}/users/${userId}`, {
        headers: await this.getAuthHeaders(),
      });
      if (!res.ok) return null;
      const data = await res.json();
      const user: PawfectFriendsUser = data.data || data;
      this.cacheSet(user);
      return user;
    } catch (e) {
      console.error('getUserProfileById error:', e);
      return null;
    }
  }

  async getShelterProfile(shelterId: string): Promise<PawfectFriendsUser | null> {
    try {
      const cached = this.cacheGet(shelterId);
      if (cached) return cached;

      const res = await fetch(`${this.config.apiBaseUrl}/users/shelters/${shelterId}`, {
        headers: await this.getAuthHeaders(),
      });
      if (!res.ok) return null;
      const data = await res.json();
      const shelter: PawfectFriendsUser = data.data || data;
      this.cacheSet(shelter);
      return shelter;
    } catch (e) {
      console.error('getShelterProfile error:', e);
      return null;
    }
  }

  /** ---------- batch users ---------- */

  private allowBatchNow(): boolean {
    const t = this.now();

    // circuit breaker
    if (t < this.circuitUntil) {
      console.warn('User batch circuit open, skip remote call.');
      return false;
    }
    // cooldown
    if (t - this.lastBatchAt < this.BATCH_COOLDOWN) {
      return false;
    }
    return true;
  }

  private recordBatchFail() {
    this.batchFailures += 1;
    if (this.batchFailures >= this.MAX_FAIL) {
      this.circuitUntil = this.now() + 60_000; // 1m
      this.batchFailures = 0; // reset counter while circuit is open
      console.warn('User batch circuit OPEN for 60s due to repeated failures.');
    }
  }

  private recordBatchOk() {
    this.batchFailures = 0;
  }

  /**
   * Get multiple users efficiently:
   * - serve cached first
   * - if allowed, fetch only uncached (and valid ObjectId) via /users/batch
   * - return merged array (cached + fetched) in the same order as input ids
   */
  async getMultipleUserProfiles(userIds: string[]): Promise<PawfectFriendsUser[]> {
    this.sweepCache();

    const unique = Array.from(new Set(userIds || []));
    if (unique.length === 0) return [];

    const cachedMap = new Map<string, PawfectFriendsUser>();
    const toFetch: string[] = [];

    for (const id of unique) {
      const c = this.cacheGet(id);
      if (c) cachedMap.set(id, c);
      else if (this.isValidObjectId(id)) toFetch.push(id);
      // ignore invalid ids silently
    }

    let fetched: PawfectFriendsUser[] = [];
    if (toFetch.length > 0 && this.allowBatchNow()) {
      this.lastBatchAt = this.now();
      try {
        // limit burst (defensive)
        if (toFetch.length > 50) toFetch.length = 50;

        const res = await fetch(`${this.config.apiBaseUrl}/users/batch`, {
          method: 'POST',
          headers: await this.getAuthHeaders(),
          body: JSON.stringify({ userIds: toFetch }), // ✅ only uncached ids
        });
        if (res.ok) {
          const json = await res.json();
          fetched = (json.data || json) as PawfectFriendsUser[];
          for (const u of fetched) this.cacheSet(u);
          this.recordBatchOk();
        } else {
          console.warn('users/batch not ok:', res.status, res.statusText);
          this.recordBatchFail();
        }
      } catch (e) {
        console.error('users/batch error:', e);
        this.recordBatchFail();
      }
    }

    // merge keeping input order
    const merged = unique
      .map(id => cachedMap.get(id) || fetched.find(u => u.id === id))
      .filter(Boolean) as PawfectFriendsUser[];

    // nếu cần trả đúng số lượng bằng input: merged có thể thiếu các id invalid/không tồn tại → đây là hành vi mong muốn.
    return merged;
  }

  /** ---------- updates & queries ---------- */

  async updateUserProfile(updates: Partial<PawfectFriendsUser>): Promise<boolean> {
    try {
      const res = await fetch(`${this.config.apiBaseUrl}/users/profile`, {
        method: 'PUT',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        // refresh cache for current user if we can
        const me = await this.getCurrentUserProfile();
        if (me) this.cacheSet(me);
      }
      return res.ok;
    } catch (e) {
      console.error('updateUserProfile error:', e);
      return false;
    }
  }

  async searchUsers(query: string): Promise<PawfectFriendsUser[]> {
    if (!query?.trim()) return [];
    try {
      const res = await fetch(
        `${this.config.apiBaseUrl}/users/search?q=${encodeURIComponent(query.trim())}`,
        { headers: await this.getAuthHeaders() },
      );
      if (!res.ok) return [];
      const data = await res.json();
      const arr: PawfectFriendsUser[] = data.data || data;
      arr.forEach(u => this.cacheSet(u));
      return arr;
    } catch (e) {
      console.error('searchUsers error:', e);
      return [];
    }
  }

  async getUsersByRole(role: string): Promise<PawfectFriendsUser[]> {
    if (!role) return [];
    try {
      const res = await fetch(`${this.config.apiBaseUrl}/users/role/${encodeURIComponent(role)}`, {
        headers: await this.getAuthHeaders(),
      });
      if (!res.ok) return [];
      const data = await res.json();
      const arr: PawfectFriendsUser[] = data.data || data;
      arr.forEach(u => this.cacheSet(u));
      return arr;
    } catch (e) {
      console.error('getUsersByRole error:', e);
      return [];
    }
  }

  async getOnlineUsers(): Promise<PawfectFriendsUser[]> {
    try {
      const res = await fetch(`${this.config.apiBaseUrl}/users/online`, {
        headers: await this.getAuthHeaders(),
      });
      if (!res.ok) return [];
      const data = await res.json();
      const arr: PawfectFriendsUser[] = data.data || data;
      arr.forEach(u => this.cacheSet(u));
      return arr;
    } catch (e) {
      console.error('getOnlineUsers error:', e);
      return [];
    }
  }
}

export const userService = new UserService();
export default userService;
