import { useContext, useEffect, useState } from 'react'
import { StoreContext } from '../stores/store'
import Loading from './Loading'
import Swal from 'sweetalert2'
import AOS from 'aos'
import 'aos/dist/aos.css'

export default function SignSuccess() {
    const { signCountState, loadingBlockState } = useContext(StoreContext);
    const [signCount, setSignCount] = signCountState;
    const [loadingBlock, setLoadingBlock] = loadingBlockState;

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
        <>
            {loadingBlock && <Loading />}
            <h3 className="success_title">{signCount < 15 ? '記得明天再回來簽到喔' : '恭喜您已完成15次簽到'}</h3>
            <img src="https://pgw.udn.com.tw/gw/photo.php?u=https://event.udn.com/bd_game2024/images/success.png" alt="簽到成功" className="success_icon" data-aos="zoom-in" data-aos-duration="700"/>
            <p className="success_note">
                ★ 小提醒：udn 遊戲角落開放讀者投稿！<br />
                現在投稿還可加碼抽其他獎項！
            </p>
            <button type="button" className="channel_btn" onClick={linkChannel}>
                <span>前往投稿</span>
            </button>
        </>
    )
}