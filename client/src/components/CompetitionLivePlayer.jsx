import { useEffect, useRef, useState } from 'react';
import flvjs from 'flv.js';
import { competitionLiveUrl, loadCompetitionPlayInfo } from '../utils/api';

export default function CompetitionLivePlayer({ deviceId, active = true }) {
    const videoRef = useRef(null);
    const playerRef = useRef(null);
    const retryTimerRef = useRef(null);
    const retryDelayRef = useRef(3000);
    const lastDeviceIdRef = useRef('');
    const [retryKey, setRetryKey] = useState(0);
    const [status, setStatus] = useState('正在连接记录仪...');
    const [playing, setPlaying] = useState(false);

    useEffect(() => {
        let cancelled = false;
        clearTimeout(retryTimerRef.current);
        if (lastDeviceIdRef.current !== deviceId) {
            lastDeviceIdRef.current = deviceId;
            retryDelayRef.current = 3000;
        }

        const destroyPlayer = () => {
            if (!playerRef.current) return;
            try {
                playerRef.current.pause();
                playerRef.current.unload();
                playerRef.current.detachMediaElement();
                playerRef.current.destroy();
            } catch (error) {
                console.error('Destroy FLV player failed:', error);
            }
            playerRef.current = null;
        };

        const scheduleRetry = (message) => {
            if (cancelled) return;
            setPlaying(false);
            setStatus(message);
            const delay = retryDelayRef.current;
            retryDelayRef.current = Math.min(delay * 2, 30000);
            retryTimerRef.current = setTimeout(() => setRetryKey((value) => value + 1), delay);
        };

        const connect = async () => {
            destroyPlayer();
            if (!active || !deviceId) return;
            if (!flvjs.isSupported()) {
                setStatus('当前浏览器不支持 HTTP-FLV 播放');
                return;
            }
            setStatus('正在连接记录仪...');
            try {
                await loadCompetitionPlayInfo(deviceId, 'flv');
                if (cancelled || !videoRef.current) return;
                const token = localStorage.getItem('token');
                const player = flvjs.createPlayer({
                    type: 'flv',
                    isLive: true,
                    hasAudio: false,
                    url: competitionLiveUrl(deviceId),
                }, {
                    enableWorker: false,
                    enableStashBuffer: false,
                    lazyLoad: false,
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                playerRef.current = player;
                player.attachMediaElement(videoRef.current);
                player.on(flvjs.Events.ERROR, () => {
                    destroyPlayer();
                    scheduleRetry('视频流暂时离线，正在重连...');
                });
                player.load();
                await player.play().catch(() => {
                    setStatus('画面已连接，点击播放');
                });
            } catch (error) {
                if (cancelled) return;
                if (error.status === 403) setStatus('无权访问该设备');
                else if (error.status === 422) setStatus('该设备暂不支持实时视频');
                else scheduleRetry(error.message || '视频连接失败，正在重试...');
            }
        };

        connect();
        return () => {
            cancelled = true;
            clearTimeout(retryTimerRef.current);
            destroyPlayer();
        };
    }, [active, deviceId, retryKey]);

    return (
        <div className="relative aspect-video overflow-hidden bg-slate-950">
            <video
                ref={videoRef}
                muted
                playsInline
                controls
                className="h-full w-full object-contain"
                onPlaying={() => { setPlaying(true); setStatus(''); retryDelayRef.current = 3000; }}
                onWaiting={() => { if (playing) setStatus('视频缓冲中...'); }}
            />
            {status && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-950/75 px-6 text-center text-sm text-slate-200">
                    <span><i className="fas fa-video mr-2 text-slate-400" />{status}</span>
                </div>
            )}
            {playing && <span className="absolute left-3 top-3 rounded bg-rose-600/90 px-2 py-1 text-xs font-bold text-white">LIVE</span>}
        </div>
    );
}
