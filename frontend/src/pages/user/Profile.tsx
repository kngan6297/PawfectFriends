function Profile() {
  return (
    <div className="w-full py-8 px-4">
      <div>
        <h1 className="mb-6 text-3xl font-bold">My Profile</h1>
        <div className="rounded-lg bg-white p-6 shadow-md">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Full Name</h3>
              <p className="mt-1 text-lg">John Doe</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Email</h3>
              <p className="mt-1 text-lg">john@example.com</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Role</h3>
              <p className="mt-1 text-lg">Pet Adopter</p>
            </div>
            <button className="mt-4 rounded-md bg-primary-600 px-4 py-2 text-white hover:bg-primary-500">
              Edit Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
