import { useEffect, useRef, useState } from 'react';
import { loadCompetitionGasReadings } from '../utils/api';

const SUCCESS_INTERVAL_MS = 3000;
const MAX_RETRY_MS = 30000;

export default function useCompetitionGasReadings() {
    const [snapshot, setSnapshot] = useState({ serverTime: null, devices: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const retryRef = useRef(SUCCESS_INTERVAL_MS);
    const timerRef = useRef(null);
    const mountedRef = useRef(true);
    const pollRef = useRef(null);

    useEffect(() => {
        mountedRef.current = true;
        async function poll() {
            clearTimeout(timerRef.current);
            try {
                const result = await loadCompetitionGasReadings();
                if (!mountedRef.current) return;
                setSnapshot({ serverTime: result.serverTime || null, devices: result.devices || [] });
                setError(null);
                setLoading(false);
                retryRef.current = SUCCESS_INTERVAL_MS;
                timerRef.current = setTimeout(poll, SUCCESS_INTERVAL_MS);
            } catch (requestError) {
                if (!mountedRef.current) return;
                setError(requestError);
                setLoading(false);
                const forbidden = requestError.status === 403 || requestError.upstreamStatus === 401;
                if (!forbidden) {
                    timerRef.current = setTimeout(poll, retryRef.current);
                    retryRef.current = Math.min(retryRef.current * 2, MAX_RETRY_MS);
                }
            }
        }
        pollRef.current = poll;
        poll();
        return () => {
            mountedRef.current = false;
            clearTimeout(timerRef.current);
            pollRef.current = null;
        };
    }, []);

    const refresh = () => pollRef.current?.();
    return { ...snapshot, loading, error, refresh };
}
