import React from 'react';
import ReactDOM from 'react-dom/client';
import '@xyflow/react/dist/style.css';
import './styles.css';
import App from './App';
const Idea2=React.lazy(()=>import('./idea2/Idea2'));
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode>{window.location.pathname.replace(/\/$/,'')==='/idea2'?<React.Suspense fallback={<p>Loading experiment…</p>}><Idea2/></React.Suspense>:<App />}</React.StrictMode>);
