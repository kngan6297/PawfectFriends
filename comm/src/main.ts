import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';

import 'element-plus/theme-chalk/src/index.scss';
import '~/styles/index.scss';

import ContextMenu from '@imengyu/vue3-context-menu';
import '@imengyu/vue3-context-menu/lib/vue3-context-menu.css';

const app = createApp(App);

app.use(createPinia());
app.use(ContextMenu);

app.mount('#app');
