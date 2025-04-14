import { useContext, useEffect, useState } from 'react'
import { StoreContext } from '../stores/store'
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3'
import axios from 'axios'
import Swal from 'sweetalert2'

export default function Login() {
    const {
        identityState,
        emailState,
        udnmemberState,
        um2State,
        loginState,
        loginBlockState,
        cardsBlockState,
        resultBlockState,
        loadingBlockState,
        signCountState,
        hasStartedState,
        eventStatusState,
        greatState,
        resultState,
        csrfTokenState,
    } = useContext(StoreContext);
    const [identity, setIdentity] = identityState;
    const [email, setEmail] = emailState;
    const [udnmember, setUdnmember] = udnmemberState;
    const [um2, setUm2] = um2State;
    const [login, setLogin] = loginState;
    const [loginBlock, setLoginBlock] = loginBlockState;
    const [loadingBlock, setLoadingBlock] = loadingBlockState;
    const [cardsBlock, setCardsBlock] = cardsBlockState;
    const [resultBlock, setResultBlock] = resultBlockState;
    const [signCount, setSignCount] = signCountState;
    const [hasStarted, setHasStarted] = hasStartedState;
    const [eventStatus, setEventStatus] = eventStatusState;
    const [great, setGreat] = greatState;
    const [result, setResult] = resultState;
    const [csrfToken, setCsrfToken] = csrfTokenState;

    // 檢查 email 格式
    const loginEmail = () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const validateEmail = emailRegex.test(email);
        if (email === '') {
            Swal.fire({
                title: '請輸入完整資料',
                confirmButtonText: 'OK',
            });
        } else if (validateEmail === false) {
            Swal.fire({
                title: '請輸入正確的 email 格式',
                confirmButtonText: 'OK',
            });
        } else if (validateEmail === true) {
            setLoadingBlock(true);
            checkRecaptcha();
        }
    }

    const handleKeyUp = (e) => {
        const key = e.key;
        if (key === 'Enter') {
            loginEmail();
        }
    }

    // udn 會員登入
    const loginUdn = () => {
        const currentURL = window.location.href;
        const loginURL = `https://member.udn.com/member/login.jsp?site=bd_game2024&again=y&redirect=${currentURL}?upass=1`;
        if (import.meta.env.MODE === 'development') {
            testUdn();
            console.log(currentURL);
            console.log(import.meta.env.MODE);
        } else {
            window.location.href = loginURL;
        }
    }

    // 本機測試 udn 會員登入
    const testUdn = () => {
        Swal.fire({
            title: '登入成功(test)',
            confirmButtonText: 'OK',
        }).then(() => {
            setLogin(true);
            setEmail('testudn@mail.com');
            setLoginBlock(false);
            setCardsBlock(true);
        });
    }

    // Google ReCaptcha
    const { executeRecaptcha } = useGoogleReCaptcha();
    const checkRecaptcha = async () => {
        const token = await executeRecaptcha('game2024_check');

        // 檢查資料紀錄
        try {
            await axios.post(`https://event.udn.com/bd_game2024/php/checkRecord.php`, {
                'token': token,
                'email': email,
                'ctk': csrfToken,
            }, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then((res) => {
                if (res.data.status === true) {
                    setLogin(true);
                    setLoginBlock(false);
                    setCardsBlock(true);
                    setSignCount(res.data.count);
                    setGreat(res.data.great);
                    setResult(res.data.result);
                } else if (res.data.message === '您今天已參加過囉！請明天再來') {
                    setLogin(true);
                    setSignCount(res.data.count);
                    setGreat(res.data.great);
                    setResult(res.data.result);
                    setHasStarted(false);
                    setEventStatus(true);
                    setLoadingBlock(false);
                    document.body.style.overflow = "";
                    Swal.fire({
                        title: res.data.message,
                        html:`<p>先別急著離開！<br/>現在投稿玩家故事，還可加碼抽其他獎項</p>`,
                        confirmButtonText: '前往投稿',
                        showCloseButton: true,
                    }).then((result) => {
                        if (result.isConfirmed) {
                            window.open("https://game.udn.com/game/post?utm_source=udn_bd&utm_medium=button_1&utm_campaign=bd_game2024", "_blank");
                        }
                    });
                } else if (res.data.message === '今天尚未簽到') {
                    setLogin(true);
                    setLoginBlock(false);
                    setResultBlock(true);
                    setSignCount(res.data.count);
                    setGreat(res.data.great);
                    setResult(res.data.result);
                    document.body.style.overflow = "hidden";
                } else {
                    setLoadingBlock(false);
                    setUdnmember('');
                    history.pushState({}, null, import.meta.env.BASE_URL);
                    Swal.fire({
                        title: res.data.message,
                        confirmButtonText: '關閉',
                    });
                }
            });
        } catch (err) {
            console.error('請求失敗:', err);
        }
    };

    useEffect(() => {
        history.pushState({}, null, import.meta.env.BASE_URL);
        if (identity === 'udn') {
            setEmail('');
        }
    }, [identity]);

    useEffect(() => {
        if (udnmember && um2) {
            setIdentity('udn');
        }
    }, []);

    useEffect(() => {
        if (executeRecaptcha && udnmember && um2) {
            checkRecaptcha();
        }
    }, [executeRecaptcha]);

    return (
        <div className="login">
            <h2 className="login_title">選擇身分進行占卜</h2>
            <div className="login_wrap">
                <button type="button" className="login_email" onClick={() => setIdentity('email')}>
                    <img src={`https://pgw.udn.com.tw/gw/photo.php?u=https://event.udn.com/bd_game2024/images/login_email_${identity === 'email' ? 'checked' : 'unchecked'}.png?v=1025`} alt="使用電子信箱" />
                </button>
                <button type="button" className="login_udn" onClick={() => setIdentity('udn')}>
                    <img src={`https://pgw.udn.com.tw/gw/photo.php?u=https://event.udn.com/bd_game2024/images/login_udn_${identity === 'udn' ? 'checked' : 'unchecked'}.png?v=1025`} alt="使用 udn 會員帳號" />
                </button>
            </div>
            {identity === 'email' && <div className="email_input">
                <input type="email" required id="email" placeholder="請輸入 e-mail" value={email} onChange={(e) => setEmail(e.target.value)} onKeyUp={handleKeyUp} />
                <button type="button" className="login_btn" onClick={loginEmail}>
                    <span>確定</span>
                </button>
            </div>}
            {identity === 'udn' &&
                <button type="button" className="login_btn udn_btn" onClick={loginUdn}>
                    <span>會員登入</span>
                </button>}
        </div>
    )
}