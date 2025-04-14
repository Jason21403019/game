import { useContext, useEffect, useState } from 'react'
import { StoreContext } from '../stores/store'
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3'
import Loading from './Loading'
import Login from './Login'
import Cards from './Cards'
import Result from './Result'
import SignSuccess from './SignSuccess'

export default function Game() {
    const {
        udnmemberState,
        loginBlockState,
        cardsBlockState,
        resultBlockState,
        signSuccessState,
        loadingBlockState,
        hasStartedState,
        eventStatusState,
        signCountState,
    } = useContext(StoreContext);
    const [udnmember, setUdnmember] = udnmemberState;
    const [loginBlock, setLoginBlock] = loginBlockState;
    const [cardsBlock, setCardsBlock] = cardsBlockState;
    const [resultBlock, setResultBlock] = resultBlockState;
    const [signSuccess, setSignSuccess] = signSuccessState;
    const [loadingBlock, setLoadingBlock] = loadingBlockState;
    const [hasStarted, setHasStarted] = hasStartedState;
    const [eventStatus, setEventStatus] = eventStatusState;
    const [signCount, setSignCount] = signCountState;

    // 關閉遊戲視窗
    const closeGame = () => {
        document.body.style.overflow = "";
        setLoginBlock(false);
        setCardsBlock(false);
        setResultBlock(false);
        setSignSuccess(false);
        setHasStarted(false);
        setEventStatus(true);
        history.pushState({}, null, import.meta.env.BASE_URL);
    }

    useEffect(() => {
        if (!udnmember) {
            setTimeout(() => {
                setLoadingBlock(false);
            }, 500);
        }
    }, []);

    return (
        <GoogleReCaptchaProvider reCaptchaKey="6LcA97YUAAAAAN9SVpbme1g1312tmkQkHHp3rN3Y">
            <div className="game">
                {loadingBlock && <Loading />}
                {!signSuccess && <div className="game_view">
                    {(udnmember === '' || signCount == 15) &&
                        <div className="close_icon" onClick={closeGame}>
                            <img src="./images/swal_close.svg" alt="關閉" />
                        </div>}
                    <img src="https://pgw.udn.com.tw/gw/photo.php?u=https://event.udn.com/bd_game2024/images/game_title.png" alt="歐氣占卜" className="game_title" />
                    {loginBlock && <Login />}
                    {cardsBlock && <Cards />}
                    {resultBlock && <Result />}
                </div>}
                {signSuccess && <div className="success_view">
                    <div className="close_icon" onClick={closeGame}>
                        <img src="./images/swal_close.svg" alt="關閉" />
                    </div>
                    <SignSuccess />
                </div>}
            </div>
        </GoogleReCaptchaProvider>
    )
}