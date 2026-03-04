import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createVuestic } from 'vuestic-ui';
import 'vuestic-ui/css';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import App from './App.vue';
import router from './router';

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(createVuestic()); // Install Vuestic UI
app.use(ElementPlus);

app.mount('#app');
