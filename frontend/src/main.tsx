
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { SocketProvider } from './context/SocketContext';
import { AuthProvider } from './context/AuthContext';

createRoot(document.getElementById("root")!).render(
	<AuthProvider>
		<SocketProvider>
			<App />
		</SocketProvider>
	</AuthProvider>
);
