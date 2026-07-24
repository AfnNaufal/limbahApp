import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import App from '../frontend/src/App';

const container = document.getElementById('app');

if (container) {
	createRoot(container).render(createElement(App));
}
