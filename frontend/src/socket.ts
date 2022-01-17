
// useEffect(() => {
//         if (browser) {
//             const connect = () => {
//                 const ws = new WebSocket("ws://localhost:5000");
//                 setWs(ws);
//                 ws.onopen = () => {
//                     console.log('Websocket Client Connected');
//                 }
//                 ws.onmessage = (e) => {
//                     const data: string = e.data;
//                     console.log(`Server Sent: ${data}`);
//                     if (data.startsWith('id')) {
//                         setId(data.split(':')[1]);
//                     } else if (data.startsWith('start')) {
//                         setRunning(true);
//                     } else if (data.startsWith('stop')) {
//                         setRunning(false);
//                     }
//                 }
//                 ws.onclose = (e) => {
//                     console.log('Socket is closed. Reconnect will be attempted in 1 second.', e.reason);
//                     setRunning(false);
//                     setId(null);
//                     setWs(null);
//                 }
//                 ws.onerror = (err) => {
//                     console.error('Socket encountered error: ', err, 'Closing socket');
//                     ws.close();
//                 }
//             }
//             connect();
//         }
// 
//         return () => {
//             if (ws !== null && ws.readyState !== 3) {
//                 ws.close();
//             }
//         }
//     }, []);
// 