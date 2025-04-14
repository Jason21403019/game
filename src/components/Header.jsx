import { useContext, useEffect, useState } from 'react'
import { StoreContext } from '../stores/store'
import Swal from 'sweetalert2'

export default function Header({ message }) {
    const { openState, screenWidthState } = useContext(StoreContext);
    const [open, setOpen] = openState;
    const [screenWidth, setScreenWidth] = screenWidthState;

    const lineLinkDesk = 'https://social-plugins.line.me/lineit/share?url=https%3A%2F%2Fevent.udn.com%2Fbd_game2024%2F%3Futm_source%3Dline_fb%26utm_medium%3Dsharepost%26utm_campaign%3Dbd_game2024';
    const lineLinkMobile = 'https://line.me/R/share?text=https%3A%2F%2Fevent.udn.com%2Fbd_game2024%2F%3Futm_source%3Dline_fb%26utm_medium%3Dsharepost%26utm_campaign%3Dbd_game2024';

    const [lineShare, setLineShare] = useState(lineLinkDesk);

    const handleMenu = () => {
        setOpen(!open);
    }

    const handleAnchor = () => {
        setOpen(false);
    }

    const resized = () => {
        setScreenWidth(window.innerWidth);
        setOpen(false);
    }

    useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
    }, [open]);

    const showWinner = () => {
        handleAnchor();
        if (message === '活動已結束，中獎名單已公布') {
            // 中獎名單網址要改
            window.open("https://event.udn.com/index/winning.html", "_blank");
        } else {
            Swal.fire({
                title: "中獎名單將於 12/11 (三) 公布<br/>敬請期待！",
                showCloseButton: true,
                confirmButtonText: "OK",
            }).then(() => {
                history.pushState({}, null, import.meta.env.BASE_URL);
            });
        }
    }

    useEffect(() => {
        if (screenWidth < 768 && "ontouchstart" in document.documentElement && navigator.maxTouchPoints) {
            setLineShare(lineLinkMobile);
        } else {
            setLineShare(lineLinkDesk);
        }
    }, [screenWidth]);

    useEffect(() => {
        setScreenWidth(window.innerWidth);
        window.addEventListener('resize', resized);
        return (() => {
            window.removeEventListener("resize", resized);
        })
    }, []);

    return (
        <header className="header">
            <div className="header_container">
                <div className="logo_wrap">
                    <a href="https://udn.com/news/index?utm_source=udn_bd&utm_medium=top&utm_campaign=bd_game2024" target="_blank" className="logo">
                        <img src="./images/logo_udn.svg" alt="聯合新聞網" className="logo_udn" />
                    </a>
                    <a href="https://game.udn.com/game/index?utm_source=udn_bd&utm_medium=top&utm_campaign=bd_game2024" target="_blank" className="logo">
                        <img src="./images/logo_game.svg" alt="遊戲角落" className="logo_game" />
                    </a>
                </div>
                <div className="header_wrap">
                    <div className="menu" style={open ? { height: "363px", opacity: "1" } : { height: "0", opacity: "0" }}>
                        <a href="#act2" className="menu_item" onClick={handleAnchor} style={open ? { pointerEvents: "auto", opacity: "1" } : { pointerEvents: "none", opacity: "0" }}>徵文懸賞</a>
                        <a href="#info" className="menu_item" onClick={handleAnchor} style={open ? { pointerEvents: "auto", opacity: "1" } : { pointerEvents: "none", opacity: "0" }}>活動辦法</a>
                        <a href="#winner" className="menu_item" onClick={showWinner} style={open ? { pointerEvents: "auto", opacity: "1" } : { pointerEvents: "none", opacity: "0" }}>中獎名單</a>
                        <img src="https://pgw.udn.com.tw/gw/photo.php?u=https://event.udn.com/bd_game2024/images/menu_deco.png&nt=1" alt="cards" className="menu_deco" style={{ opacity: open ? "1" : "0" }}/>
                    </div>
                    <div className="icon">
                        <a href="https://www.facebook.com/sharer/sharer.php?u=https://event.udn.com/bd_game2024/?utm_source=line_fb&utm_medium=sharepost&utm_campaign=bd_game2024" className="menu_fb" target="_blank">
                            <img src="./images/share_fb.svg" alt="FB" className="icon_fb" />
                        </a>
                        <a href={lineShare} className="menu_line" target="_blank">
                            <img src="https://pgw.udn.com.tw/gw/photo.php?u=https://event.udn.com/bd_game2024/images/share_line.png" alt="LINE" className="icon_line" />
                        </a>
                        <div className="menu_ham" onClick={handleMenu}>
                            <img src="./images/menu_ham.svg" alt="menu" />
                        </div>
                        <div className="menu_close" onClick={handleAnchor} style={{ opacity: open ? "1" : "0" }}>
                            <img src="./images/menu_arrow.svg" alt="close" />
                        </div>
                    </div>
                </div>
            </div>
        </header>
    )
}