import { useState, useEffect } from 'react';
import api from '../services/api';

const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
};

export const usePushNotifications = () => {
    const [supported, setSupported] = useState(false);
    const [subscribed, setSubscribed] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setSupported('serviceWorker' in navigator && 'PushManager' in window);
        checkSubscription();
    }, []);

    const checkSubscription = async () => {
        if (!('serviceWorker' in navigator)) return;
        try {
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.getSubscription();
            setSubscribed(!!sub);
        } catch (_) {}
    };

    const subscribe = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/push/vapid-public-key');
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(data.publicKey)
            });
            await api.post('/push/subscribe', { subscription: sub.toJSON() });
            setSubscribed(true);
        } catch (e) {
            console.error('Push subscribe error:', e);
        } finally {
            setLoading(false);
        }
    };

    const unsubscribe = async () => {
        setLoading(true);
        try {
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.getSubscription();
            if (sub) {
                await api.post('/push/unsubscribe', { endpoint: sub.endpoint });
                await sub.unsubscribe();
            }
            setSubscribed(false);
        } catch (e) {
            console.error('Push unsubscribe error:', e);
        } finally {
            setLoading(false);
        }
    };

    return { supported, subscribed, loading, subscribe, unsubscribe };
};
