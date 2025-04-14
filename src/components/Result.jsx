import { useContext, useEffect, useState } from 'react'
import { StoreContext } from '../stores/store'
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3'
import axios from 'axios'
import Swal from 'sweetalert2'
import AOS from 'aos'
import 'aos/dist/aos.css'

export default function Result() {
    const {
        udnmemberState,
        um2State,
        resultBlockState,
        signSuccessState,
        loadingBlockState,
        signCountState,
        screenWidthState,
        resultState,
        csrfTokenState,
    } = useContext(StoreContext);
    const [udnmember, setUdnmember] = udnmemberState;
    const [um2, setUm2] = um2State;
    const [resultBlock, setResultBlock] = resultBlockState;
    const [signSuccess, setSignSuccess] = signSuccessState;
    const [loadingBlock, setLoadingBlock] = loadingBlockState;
    const [signCount, setSignCount] = signCountState;
    const [screenWidth, setScreenWidth] = screenWidthState;
    const [result, setResult] = resultState;
    const [csrfToken, setCsrfToken] = csrfTokenState;

    // Google ReCaptcha
    const { executeRecaptcha } = useGoogleReCaptcha();
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
                    'Content-Type': 'application/json'
                }
            }).then((res) => {
                if (res.data.status === true) {
                    setResultBlock(false);
                    setSignSuccess(true);
                    setSignCount(res.data.count);
                } else {
                    setLoadingBlock(false);
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

    useEffect(() => {
        AOS.init();
        setTimeout(() => {
            setLoadingBlock(false);
        }, 500);
    }, []);

    return (
        <div className="cards card_deco">
            <div className="cards_container">
                <div className="flip_card no_flow">
                    <div className="flip_card_inner flipped">
                        <div className="flip_card_front">
                            <img src="https://pgw.udn.com.tw/gw/photo.php?u=https://event.udn.com/bd_game2024/images/card.png&nt=1" alt="card" />
                        </div>
                        <div className="flip_card_back">
                            <img src={`https://pgw.udn.com.tw/gw/photo.php?u=https://event.udn.com/bd_game2024/images/card_${result}.png&nt=1`} alt={result} />
                            <div className="result_info" data-aos="zoom-in" data-aos-duration="1000">
                                <p className="result_info_prize">
                                    你已完成今日占卜！<br />
                                    恭喜獲得<br />
                                    <span>全聯禮券 $500 </span>抽獎資格
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="btn_wrap result_btn_wrap">
                <div className="next_step">
                    <span className="text">★ 請按下一步完成今日簽到</span>
                    <button type="button" className="result_btn" onClick={signInRecaptcha}><span>下一步</span></button>
                </div>
                <button type="button" className="result_btn" onClick={() => shareResult(result)}><span>LINE 分享結果</span></button>
            </div>
        </div>
    )
}