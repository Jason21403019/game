import { useContext, useEffect, useState } from 'react'
import { StoreContext } from '../stores/store'
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3'
import axios from 'axios'
import Swal from 'sweetalert2'
import AOS from 'aos'
import 'aos/dist/aos.css'

export default function Cards() {
    const {
        identityState,
        emailState,
        udnmemberState,
        um2State,
        cardsBlockState,
        signSuccessState,
        loadingBlockState,
        signCountState,
        hasStartedState,
        eventStatusState,
        screenWidthState,
        resultState,
        greatState,
        csrfTokenState,
    } = useContext(StoreContext);
    const [identity, setIdentity] = identityState;
    const [email, setEmail] = emailState;
    const [udnmember, setUdnmember] = udnmemberState;
    const [um2, setUm2] = um2State;
    const [cardsBlock, setCardsBlock] = cardsBlockState;
    const [signSuccess, setSignSuccess] = signSuccessState;
    const [loadingBlock, setLoadingBlock] = loadingBlockState;
    const [signCount, setSignCount] = signCountState;
    const [hasStarted, setHasStarted] = hasStartedState;
    const [eventStatus, setEventStatus] = eventStatusState;
    const [screenWidth, setScreenWidth] = screenWidthState;
    const [result, setResult] = resultState;
    const [great, setGreat] = greatState;
    const [csrfToken, setCsrfToken] = csrfTokenState;

    const [isFlipped, setIsFlipped] = useState(0);
    const [showInfo, setShowInfo] = useState(false);

    // 卡片翻面
    const flipCard = (id) => {
        if (isFlipped === 0) {
            setIsFlipped(id);
        }
    }

    // Google ReCaptcha
    const { executeRecaptcha } = useGoogleReCaptcha();
    const submitRecaptcha = async (id) => {
        if (isFlipped === 0) {
            const token = await executeRecaptcha('game2024_submit');

            // 抽卡新增/更新資料
            try {
                await axios.post(`https://event.udn.com/bd_game2024/php/store.php`, {
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
                        flipCard(id);
                        setResult(res.data.result);
                        setSignCount(res.data.count);
                        setGreat(res.data.great);
                        if (screenWidth < 768) {
                            setTimeout(() => {
                                setShowInfo(true);
                            }, 900);
                        } else {
                            setTimeout(() => {
                                setShowInfo(true);
                            }, 1300);
                        }
                    } else {
                        Swal.fire({
                            title: res.data.message,
                            confirmButtonText: '關閉',
                        });
                    }
                });
            } catch (err) {
                console.error('請求失敗:', err);
            }
        }
    };

    const signInRecaptcha = async () => {
        const token = await executeRecaptcha('game2024_signin');
        setLoadingBlock(true);

        // 更新會員簽到資料
        try {
            await axios.post(`https://event.udn.com/bd_game2024/php/updateCount.php`, {
                'token': token,
                'ctk': csrfToken,
            }, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'application/json',
                }
            }).then((res) => {
                if (res.data.status === true) {
                    setCardsBlock(false);
                    setSignSuccess(true);
                    setSignCount(res.data.count);
                } else {
                    setLoadingBlock(false);
                    Swal.fire({
                        title: res.data.message,
                        confirmButtonText: 'OK',
                    });
                }
            });
        } catch (err) {
            console.error('請求失敗:', err);
        }
    }

    // LINE 分享占卜結果
    const shareResult = (item) => {
        if (screenWidth < 768 && "ontouchstart" in document.documentElement && navigator.maxTouchPoints) {
            window.open(
                `https://line.me/R/share?text=https%3A%2F%2Fevent.udn.com%2Fbd_game2024%2Fresult%2F${item}.html%3Futm_source%3Dline_fb%26utm_medium%3Dsharepost%26utm_campaign%3Dbd_game2024`
                , "_blank");
        } else {
            window.open(
                `https://social-plugins.line.me/lineit/share?url=https%3A%2F%2Fevent.udn.com%2Fbd_game2024%2Fresult%2F${item}.html%3Futm_source%3Dline_fb%26utm_medium%3Dsharepost%26utm_campaign%3Dbd_game2024`
                , "_blank");
        }
    }

    // 另開遊戲角落連結
    const linkChannel = () => {
        window.open("https://game.udn.com/game/post?utm_source=udn_bd&utm_medium=button_1&utm_campaign=bd_game2024", "_blank");
    }

    useEffect(() => {
        AOS.init();
        setTimeout(() => {
            setLoadingBlock(false);
        }, 500);
    }, []);

    return (
        <div className={`cards ${isFlipped !== 0 ? "card_deco" : ""}`}>
            {isFlipped === 0 && <h3 className="cards_title">請憑直覺挑選任一張卡牌</h3>}
            <div className="cards_container">
                {[1, 2, 3, 4].map(item => {
                    return <div className={`flip_card ${isFlipped === item ? "no_flow" : ""}${isFlipped !== item && isFlipped !== 0 ? "disappear" : ""}`} key={item}>
                        <div className={`flip_card_inner ${isFlipped === item ? "flipped" : ""}`} onClick={() => submitRecaptcha(item)}>
                            <div className={`flip_card_front ${isFlipped === item ? "flip_card_front_bigger" : ""}`}>
                                <img src="https://pgw.udn.com.tw/gw/photo.php?u=https://event.udn.com/bd_game2024/images/card.png&nt=1" alt="card" />
                            </div>
                            <div className="flip_card_back">
                                {result && <>
                                    <img src={`https://pgw.udn.com.tw/gw/photo.php?u=https://event.udn.com/bd_game2024/images/card_${result}.png&nt=1`} alt={result} />
                                    {showInfo && <div className="result_info" data-aos="zoom-in" data-aos-duration="1000">
                                        <p className="result_info_prize">
                                            你已完成今日占卜！<br />
                                            恭喜獲得<br />
                                            <span>全聯禮券 $500 </span>抽獎資格
                                        </p>
                                        {(identity === 'email' || signCount === 15) && <p className="result_info_note">
                                            ★ 小提醒：<br />
                                            udn 遊戲角落開放讀者投稿！<br />
                                            現在投稿還可加碼抽其他獎項！
                                        </p>}
                                    </div>}
                                </>}
                            </div>
                        </div>
                    </div>
                })}
            </div>
            {isFlipped !== 0 && <div className="btn_wrap">
                {(identity === 'email' || signCount == 15) && <>
                    <button type="button" className="result_btn" onClick={linkChannel}><span>前往投稿</span></button>
                    <button type="button" className="result_btn" onClick={() => shareResult(result)}><span>LINE 分享結果</span></button>
                </>}
                {(identity === 'udn' && signCount < 15) && <>
                    <div className="next_step">
                        <span className="text">★ 請按下一步完成今日簽到</span>
                        <button type="button" className="result_btn" onClick={signInRecaptcha}><span>下一步</span></button>
                    </div>
                    <button type="button" className="result_btn" onClick={() => shareResult(result)}><span>LINE 分享結果</span></button>
                </>}
            </div>}
        </div>
    )
}