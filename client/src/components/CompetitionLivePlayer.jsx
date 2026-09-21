import { useCallback, useEffect, useRef, useState } from 'react';
import flvjs from 'flv.js';
import TCPlayer from 'tcplayer.js';
import 'tcplayer.js/dist/tcplayer.min.css';
import { competitionLiveUrl, loadCompetitionPlayInfo } from '../utils/api';

const WEBRTC_RETRYABLE_STATUSES = new Set([0, 408, 422, 429, 500, 502, 503, 504]);
const TCPLAYER_LICENSE_URL = String(import.meta.env.VITE_TCPLAYER_LICENSE_URL || '').trim();

export default function CompetitionLivePlayer({ deviceId, active = true, fill = false }) {
    const videoRef = useRef(null);
    const playerRef = useRef(null);
    const retryTimerRef = useRef(null);
    const bufferingTimerRef = useRef(null);
    const retryDelayRef = useRef(3000);
    const lastDeviceIdRef = useRef('');
    const flvFallbackDeviceIdRef = useRef('');
    const [fallbackVersion, setFallbackVersion] = useState(0);
    const [retryKey, setRetryKey] = useState(0);
    const [status, setStatus] = useState('正在连接记录仪...');
    const [playing, setPlaying] = useState(false);
    const [buffering, setBuffering] = useState(false);

    const markPlaying = useCallback(() => {
        clearTimeout(bufferingTimerRef.current);
        bufferingTimerRef.current = null;
        setPlaying(true);
        setBuffering(false);
        setStatus('');
        retryDelayRef.current = 3000;
    }, []);

    useEffect(() => {
        let cancelled = false;
        let switchedToFlv = false;
        clearTimeout(retryTimerRef.current);

        // A newly selected recorder should always get a fresh WebRTC attempt,
        // even when the previous recorder was using the FLV compatibility path.
        const isNewDevice = lastDeviceIdRef.current !== deviceId;
        if (isNewDevice) {
            lastDeviceIdRef.current = deviceId;
            retryDelayRef.current = 3000;
            flvFallbackDeviceIdRef.current = '';
        }
        const effectiveTransport = flvFallbackDeviceIdRef.current === deviceId ? 'flv' : 'webrtc';

        const destroyPlayer = () => {
            clearTimeout(bufferingTimerRef.current);
            bufferingTimerRef.current = null;
            const player = playerRef.current;
            playerRef.current = null;
            if (!player) return;
            try {
                if (player.kind === 'tcplayer') player.instance.dispose();
                else {
                    player.instance.pause();
                    player.instance.unload();
                    player.instance.detachMediaElement();
                    player.instance.destroy();
                }
            } catch (error) {
                console.warn('Destroy live player failed:', error);
            }
        };

        const markPlayingIfActive = () => {
            if (cancelled) return;
            markPlaying();
        };

        const scheduleFlvRetry = (message) => {
            if (cancelled) return;
            setPlaying(false);
            setStatus(message);
            const delay = retryDelayRef.current;
            retryDelayRef.current = Math.min(delay * 2, 30000);
            retryTimerRef.current = setTimeout(() => setRetryKey((value) => value + 1), delay);
        };

        const fallbackToFlv = (message) => {
            if (cancelled || switchedToFlv) return;
            switchedToFlv = true;
            destroyPlayer();
            setPlaying(false);
            setBuffering(false);
            setStatus(message || '低延迟视频不可用，正在切换兼容视频流...');
            flvFallbackDeviceIdRef.current = deviceId;
            setFallbackVersion((value) => value + 1);
        };

        const connectFlv = async () => {
            if (!flvjs.isSupported()) {
                setStatus('当前浏览器不支持实时视频播放');
                return;
            }
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
                stashInitialSize: 128 * 1024,
                lazyLoad: false,
                autoCleanupSourceBuffer: true,
                autoCleanupMaxBackwardDuration: 3,
                autoCleanupMinBackwardDuration: 1,
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            playerRef.current = { kind: 'flv', instance: player };
            player.on(flvjs.Events.ERROR, () => {
                destroyPlayer();
                scheduleFlvRetry('视频流暂时离线，正在重连...');
            });
            player.attachMediaElement(videoRef.current);
            player.load();
            await player.play().catch(() => setStatus('画面已连接，点击播放'));
        };

        const connectWebRtc = async () => {
            if (!TCPLAYER_LICENSE_URL) {
                const error = new Error('未配置腾讯播放器 License');
                error.code = 'TCPLAYER_LICENSE_MISSING';
                throw error;
            }
            const playInfo = await loadCompetitionPlayInfo(deviceId, 'webrtc');
            if (!String(playInfo?.url || '').startsWith('webrtc://')) {
                throw new Error('比赛设备没有返回 WebRTC 播放地址');
            }
            if (cancelled || !videoRef.current) return;

            const player = TCPlayer(videoRef.current.id, {
                sources: [{ src: playInfo.url }],
                autoplay: true,
                muted: true,
                playsinline: true,
                controls: true,
                preload: 'auto',
                licenseUrl: TCPLAYER_LICENSE_URL,
                webrtcConfig: {
                    connectRetryCount: 2,
                    connectRetryDelay: 1,
                    receiveAudio: false,
                    receiveVideo: true,
                    // Do not let TCPlayer downgrade to a direct HTTP-FLV URL:
                    // HTTPS pages use the authenticated same-origin FLV relay.
                    fallback: false,
                    showLog: false,
                },
            });
            playerRef.current = { kind: 'tcplayer', instance: player };
            player.on('playing', markPlayingIfActive);
            player.on('waiting', () => {
                if (cancelled) return;
                clearTimeout(bufferingTimerRef.current);
                bufferingTimerRef.current = setTimeout(() => setBuffering(true), 1500);
            });
            player.on('error', () => fallbackToFlv('低延迟视频连接失败，正在切换兼容视频流...'));
            player.on('webrtcevent', (event) => {
                const code = event?.data?.code;
                if (code === 1003) markPlayingIfActive();
                if (code === 1006) fallbackToFlv('低延迟视频暂无数据，正在切换兼容视频流...');
            });
            await Promise.resolve(player.play()).catch(() => {
                fallbackToFlv('低延迟视频连接失败，正在切换兼容视频流...');
            });
        };

        const connect = async () => {
            setPlaying(false);
            setBuffering(false);
            destroyPlayer();
            if (!active || !deviceId) return;
            setStatus(effectiveTransport === 'webrtc' ? '正在连接低延迟视频...' : '正在连接兼容视频流...');
            try {
                if (effectiveTransport === 'webrtc') await connectWebRtc();
                else await connectFlv();
            } catch (error) {
                if (cancelled) return;
                if (error.status === 403) {
                    setStatus('无权访问该设备');
                    return;
                }
                if (effectiveTransport === 'webrtc' && error.code === 'TCPLAYER_LICENSE_MISSING') {
                    console.warn('TCPlayer License is not configured; using the HTTP-FLV compatibility stream.');
                    fallbackToFlv('未配置腾讯播放器授权，正在切换兼容视频流...');
                    return;
                }
                if (effectiveTransport === 'webrtc'
                    && (!error.status || WEBRTC_RETRYABLE_STATUSES.has(error.status))) {
                    fallbackToFlv('低延迟视频不可用，正在切换兼容视频流...');
                    return;
                }
                if (error.status === 422) {
                    setStatus('该设备暂不支持实时视频');
                    return;
                }
                scheduleFlvRetry(error.message || '视频连接失败，正在重试...');
            }
        };

        connect();
        return () => {
            cancelled = true;
            clearTimeout(retryTimerRef.current);
            destroyPlayer();
        };
    }, [active, deviceId, fallbackVersion, markPlaying, retryKey]);

    return (
        <div className={`relative overflow-hidden bg-slate-950 ${fill ? 'h-full w-full' : 'aspect-video'}`}>
            <video
                ref={videoRef}
                id={`competition-live-player-${String(deviceId || 'device').replace(/[^a-zA-Z0-9_-]/g, '-')}`}
                muted
                playsInline
                controls
                className="h-full w-full object-contain"
                onPlaying={markPlaying}
                onWaiting={() => {
                    if (!playing) return;
                    clearTimeout(bufferingTimerRef.current);
                    bufferingTimerRef.current = setTimeout(() => setBuffering(true), 1500);
                }}
            />
            {status && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-950/75 px-6 text-center text-sm text-slate-200">
                    <span><i className="fas fa-video mr-2 text-slate-400" />{status}</span>
                </div>
            )}
            {playing && buffering && !status && <span className="absolute bottom-3 right-3 rounded bg-slate-950/70 px-2.5 py-1.5 text-xs font-medium text-slate-200"><i className="fas fa-spinner fa-spin mr-1.5 text-slate-300" />网络波动，画面恢复中</span>}
            {playing && <span className="absolute left-3 top-3 rounded bg-rose-600/90 px-2 py-1 text-xs font-bold text-white">LIVE</span>}
        </div>
    );
}
