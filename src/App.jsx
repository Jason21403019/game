import { useContext, useState, useEffect, useRef } from 'react'
import { StoreContext } from './stores/store'
import './App.scss'
import Header from './components/Header'
import Loading from './components/Loading'
import Game from './components/Game'
import axios from 'axios'
import Swal from 'sweetalert2'
import AOS from 'aos'
import 'aos/dist/aos.css'

function getCookieByName(cname) {
    if (typeof document.cookie === 'undefined') {
        return '';
    } else {
        const cookieArr = document.cookie.split(';');
        for (let i = 0; i < cookieArr.length; i++) {
            const cookiePair = cookieArr[i].split('=');
            if (cname === cookiePair[0].trim()) {
                return decodeURIComponent(cookiePair[1]);
            }
        }
    }
    return '';
};

export default function App() {
    const {
        identityState,
        emailState,
        udnmemberState,
        um2State,
        loginState,
        loginBlockState,
        loadingBlockState,
        hasStartedState,
        eventStatusState,
        signCountState,
        openState,
        resultState,
        greatState,
        csrfTokenState,
    } = useContext(StoreContext);
    const [identity, setIdentity] = identityState;
    const [email, setEmail] = emailState;
    const [udnmember, setUdnmember] = udnmemberState;
    const [um2, setUm2] = um2State;
    const [login, setLogin] = loginState;
    const [loginBlock, setLoginBlock] = loginBlockState;
    const [loadingBlock, setLoadingBlock] = loadingBlockState;
    const [hasStarted, setHasStarted] = hasStartedState;
    const [eventStatus, setEventStatus] = eventStatusState;
    const [signCount, setSignCount] = signCountState;
    const [open, setOpen] = openState;
    const [result, setResult] = resultState;
    const [great, setGreat] = greatState;
    const [csrfToken, setCsrfToken] = csrfTokenState;

    const [signArr, setSignArr] = useState(['unsigned', 'unsigned', 'unsigned', 'unsigned', 'unsigned', 'unsigned', 'unsigned', 'unsigned', 'unsigned', 'unsigned', 'unsigned', 'unsigned', 'unsigned', 'unsigned', 'unsigned']);
    const [message, setMessage] = useState('');
    const ref = useRef();

    // 檢查活動狀態
    const checkStatus = async () => {
        try {
            const res = await axios.post(`https://event.udn.com/bd_game2024/php/checkStatus.php`);

            if (res.data.message === '活動已結束，中獎名單已公布') {
                setMessage('活動已結束，中獎名單已公布');
                setEventStatus(false);
                Swal.fire({
                    title: '感謝您的參與！中獎名單已公布',
                    showCloseButton: true,
                    confirmButtonText: '立即前往',
                }).then((result) => {
                    if (result.isConfirmed) {
                        // 中獎名單網址要改
                        window.open("https://event.udn.com/index/winning.html", "_blank");
                    }
                });
            } else if (res.data.message === '活動已結束，尚未公布中獎名單') {
                setMessage('活動已結束，尚未公布中獎名單');
                setEventStatus(false);
                Swal.fire({
                    title: '活動已結束，感謝您的參與！',
                    text: '中獎名單將於 12/11 (三) 公布',
                    showCloseButton: true,
                    confirmButtonText: 'OK',
                });
            } else if (res.data.message === '活動尚未開始') {
                setEventStatus(false);
                Swal.fire({
                    title: '活動尚未開始！',
                    showCloseButton: true,
                    confirmButtonText: 'OK',
                });
            } else if (res.data.status === true) {
                setCsrfToken(res.data.message);
            }
        } catch (error) {
            console.error('請求失敗:', error);
        }
    }

    // 判斷網址 upass=1 確認是否透過 udn 連結登入
    const checkUdn = () => {
        const getMember = JSON.parse(sessionStorage.getItem('member'));
        const fromUdn = window.location.href.indexOf('upass=1') != -1 ? true : false;
        const udnCookie = getCookieByName('udnmember');
        const um2Cookie = getCookieByName('um2');
        if (fromUdn) {
            setUdnmember(udnCookie);
            setUm2(um2Cookie);
            setHasStarted(true);
        } else if (getMember !== null) {
            if (getMember === udnCookie && getMember !== 'undefined' && getMember !== '' && getMember !== null && um2Cookie !== 'undefined' && um2Cookie !== '' && um2Cookie !== null) {
                setUdnmember(udnCookie);
                setUm2(um2Cookie);
                setHasStarted(true);
            } else {
                sessionStorage.removeItem('member');
                setTimeout(() => {
                    setLoadingBlock(false);
                }, 700);
            }
        } else {
            setTimeout(() => {
                setLoadingBlock(false);
            }, 700);
        }
    }

    useEffect(() => {
        sessionStorage.setItem('member', JSON.stringify(udnmember));
    }, [udnmember]);

    // 點擊開始占卜按鈕
    const startGame = () => {
        document.body.style.overflow = "hidden";
        setEventStatus(false);
        setHasStarted(true);
        setLoginBlock(true);
        setLoadingBlock(true);
        setIdentity('');
        setEmail('');
        setUdnmember('');
        setUm2('');
        setLogin(false);
        setSignCount(0);
        setResult('');
        setGreat(0);
    }

    // 確認是否在 LINE 或 FB 瀏覽器
    const checkAndRedirect = () => {
        const u = navigator.userAgent;
        const isLineApp = u.indexOf('Line') > -1 ? true : false;
        const isFbApp = u.indexOf('FBAV') > -1 ? true : false;
        if (isLineApp || isFbApp) {
            const isAppUrl = window.location.href.includes('openExternalBrowser=1')
                ? true
                : false;
            if (!isAppUrl) {
                const separator = window.location.href.includes('?') ? '&' : '?';
                window.location.href =
                    window.location.href + separator + 'openExternalBrowser=1';
            }
        }
        if (isFbApp) {
            Swal.fire({
                title: '您正在使用 Facebook 內建瀏覽器',
                text: '建議使用外部瀏覽器開啟，以獲得最佳體驗',
                confirmButtonText: 'OK',
            });
        }
    };

    useEffect(() => {
        checkAndRedirect();
        checkStatus();
        checkUdn();
        AOS.init();
    }, []);

    // 更新簽到記錄區
    useEffect(() => {
        if (signCount > 0) {
            const newSignArr = signArr.map((item, index) => {
                if (index + 1 > signCount) {
                    return item;
                } else {
                    return 'signed';
                }
            });
            setSignArr(newSignArr);
        } else {
            const newSignArr = ['unsigned', 'unsigned', 'unsigned', 'unsigned', 'unsigned', 'unsigned', 'unsigned', 'unsigned', 'unsigned', 'unsigned', 'unsigned', 'unsigned', 'unsigned', 'unsigned', 'unsigned'];
            setSignArr(newSignArr);
        }
    }, [signCount]);

    // menu open 背景模糊
    useEffect(() => {
        if (open) {
            ref.current.style.filter = "blur(10px) brightness(30%)";
        } else {
            ref.current.style.filter = "none";
        }
    }, [open]);

    // 個資聲明彈窗
    const showDeclare = () => {
        Swal.fire({
            customClass: {
                container: "note_box"
            },
            title: "個資聲明",
            showConfirmButton: false,
            showCloseButton: true,
            allowOutsideClick: false,
            html: `<span>個人資料保護法告知事項：</span>
            <p>聯合線上股份有限公司（以下簡稱本公司）茲依據個人資料保護法（以下簡稱個資法）之相關規定，告知以下個資宣告事項，敬請詳閱：</p>
            <ul class="description">
         <li>蒐集個人資料公司：聯合線上股份有限公司（以下簡稱本公司）。</li>
         <li>蒐集之目的：行銷。</li>
         <li>個人資料之類別：姓名、地址、電子郵件及電話於參加活動時所提供之個人資料。</li>
         <li>個人資料利用之期間：自台端參加本公司任何活動日起地兩年內之間。</li>
         <li>個人資料利用之地區：本公司營運範圍，僅限於台灣、金門、澎湖、馬祖等地區利用，且不會移轉至其他境外地區利用。</li>
         <li>個人資料利用之對象及方式：由本公司該業務承辦人員於辦理該活動之特定目的必要範圍內，依通常作業所必要之方式利用此個人資料。本活動網站公開之資料，公眾將可透過網際網路瀏覽參與活動所公開之資料或中獎資訊。本公司對於中獎資訊之公布，將採取隱匿部分個人資訊之方式處理，以確保個人資料之安全。</li>
         <li>依個人資料保護法第三條規定得行使之權利及方式：台端得向本公司承辦該項業務單位「聯合線上股份有限公司」提出申請，以查詢、閱覽、製給複製本；或補充／更正、請求停止蒐集、處理、利用或刪除個人資料內容之一部或全部。（註：參加人申請查詢、閱覽、製給複製本時，將酌收必要成本費用。）</li>
         <li>台端填寫個人資料後，以任何方式遞送至本公司收執時，均視為台端已同意其所填寫之個人資料，供本公司於辦理『歐氣占卜 – 天天測運勢，簽到拿好禮』活動之特定目的必要範圍內處理及利用；此外，台端可自行決定是否填寫相關之個人資料欄位，若台端選擇不願填寫，將無法參加本次活動所提供之相關服務或遭取消中獎資格。</li>
         <li>個人資料安全措施：本公司將依據相關法令之規定建構完善措施，保障台端個人資料之安全。</li>
       </ul>`,
        })
    }

    // 注意事項彈窗
    const showNotice = () => {
        Swal.fire({
            customClass: {
                container: "note_box"
            },
            title: "注意事項",
            showConfirmButton: false,
            showCloseButton: true,
            allowOutsideClick: false,
            html: `<ul class="description">
          <li>本網站受 reCAPTCHA 保護，適用 Google 隱私政策和服務條款。</li>
          <li>所有活動相關辦法，皆以本網頁公佈為主，獎品項目則依實物為主。所有活動相關辦法，皆以本網頁公佈為主，獎品項目則依實物為主。（聯合線上及相關之母公司、子公司、關係企業、員工，不具領(獲)獎資格）</li>
          <li>網友填寫資料之目的係作為確認身分，以便進行活動。網友同意聯合線上得利用資料作為將來產品行銷暨公關活動之用。聯合線上保證登入資料不洩漏予第三人，亦不進行前述目的範圍以外之利用。未依規定詳填資料（姓名、E-Mail、電話、個人影片），致網友有任何損失者，聯合線上恕不負責。</li>
          <li>本活動得獎資料如有不符合資格或取消者皆不遞補。所有獎項皆不重複得獎，如有發現偽造資格或不法得獎者，聯合線上皆有權取消得獎資格。</li>
          <li>參加者於參加本活動同時，即同意接受本活動之活動辦法與注意事項規範，並須遵守聯合線上的服務條款、使用規範及其他交易有關之規定，若發現有使用網頁機器人參與活動違反之規定，聯合線上得取消其參加或得獎資格，並就因此所生之損害，得向參加者請求損害賠償。</li>
          <li>參加者應保證所有填寫或提出之資料均為真實且正確，且未冒用或盜用任何第三人之資料。如有不實或不正確之情事，聯合線上得取消參加或得獎資格。如因此致聯合線上無法通知其得獎訊息時，聯合線上不負任何法律責任，且如有致損害於聯合線上或其他任何第三人，參加者應負一切相關責任。</li>
          <li>得獎者應於聯合線上通知之期限內回覆確認同意領取獎品，並提供聯合線上所要求之完整領獎文件，逾期視為棄權。</li>
          <li>如有任何因電腦、網路、電話、技術或不可歸責於聯合線上之事由，而使參加者所寄出或登錄之資料有遲延、遺失、錯誤、無法辨識或毀損之情況致使參加者無法參加活動時，聯合線上不負任何法律責任，參加者亦不得因此異議。</li>
          <li>如本活動因不可抗力或其他特殊原因致無法舉行時，聯合線上有權決定取消、終止、修改或暫停本活動。</li>
          <li>活動獎項以公佈於本網站上的資料為準，如遇不可抗拒或非可歸責於聯合線上之因素，致無法提供原訂獎項時，聯合線上保留更換其他等值獎項之權利。</li>
          <li>活動獎項價值超過新台幣 20,000 元者，得獎者應自行負擔 10% 之機會中獎所得稅。活動獎項如為現金，聯合線上有權自應給付獎金中逕予扣除相關所得稅，現金以外之獎項，得獎者應先繳納中獎所得稅後，始得領取活動獎品。</li>
          <li>參加者如因參加本活動或因活動獎項而遭受任何損失，聯合線上及相關之母公司、子公司、關係企業、員工、及代理商不負任何責任。一旦得獎者領取獎品後，若有遺失或被竊，聯合線上或贊助廠商等不發給任何證明或補償。</li>
          <li>得獎者應自行負擔活動獎項寄送之郵資。獎項寄送地區僅限台、澎、金、馬，聯合線上不處理郵寄獎品至海外地區之事宜。本活動之獎品不得轉換、轉讓或折換現金。</li>
          <li>活動參加者同意聯合線上得將其部分姓名與 E-Mail，公佈於本活動網站或相關行銷活動網站或宣傳物中並同意聯合線上蒐集其姓名及聯絡方式（電話、地址或 E-Mail）作為贈獎聯繫使用。</li>
          <li>客戶服務信箱 <a href="mailto:vaservice@udn.com">vaservice@udn.com</a>，服務時間週一 ~ 週五，09:30 ~ 12:00、13:30 ~ 17:30，例假日及國定假日暫不提供服務。</li>
        </ul>`,
        })
    }

    return (
        <>
            {loadingBlock && <Loading />}
            <Header message={message} />
            <section className="container" ref={ref}>
                <section id="banner">
                    <div className="kv">
                        <picture>
                            <source media="(max-width: 479.9px)" srcSet="https://pgw.udn.com.tw/gw/photo.php?u=https://event.udn.com/bd_game2024/images/kv_mb.webp&nt=1" />
                            <source media="(min-width: 480px)" srcSet="https://pgw.udn.com.tw/gw/photo.php?u=https://event.udn.com/bd_game2024/images/kv.webp&nt=1" />
                            <img src="https://pgw.udn.com.tw/gw/photo.php?u=https://event.udn.com/bd_game2024/images/kv.webp&nt=1" alt="歐氣占卜" />
                        </picture>
                    </div>
                    <a href="#start" className="start_btn" data-action="submit" onClick={startGame} style={!eventStatus ? { pointerEvents: "none", animation: "none", filter: "brightness(70%)" } : { pointerEvents: "auto" }}>
                        <img src="https://pgw.udn.com.tw/gw/photo.php?u=https://event.udn.com/bd_game2024/images/kv_btn.png&nt=1" alt="開始占卜" />
                    </a>
                </section>
                <div className="rect"></div>
                <section className="act1" data-aos="fade-up" data-aos-duration="1500">
                    <div className="sign_count">
                        <img src="./images/title_deco.svg" alt="icon" className="count_deco" />
                        <span className="count">您已累計&nbsp;&nbsp;<b>{signCount}</b>&nbsp;次簽到&nbsp;｜&nbsp;<a href="#sign_record">簽到紀錄</a></span>
                        <span className="count_mb">您已累計&nbsp;&nbsp;<b>{signCount}</b>&nbsp;次簽到</span>
                    </div>
                    <div className="act1_title">
                        <p>
                            活動期間，使用 e-mail 或會員帳號，每天都可玩一次歐氣占卜。<br />選擇會員帳號遊玩，還可挑戰簽到，解鎖更多獎勵！
                        </p>
                    </div>
                    <div className="act1_prize">
                        <img src="https://pgw.udn.com.tw/gw/photo.php?u=https://event.udn.com/bd_game2024/images/title_act1_prize.png&nt=1" alt="占卜獎勵" className="subtitle" />
                        <div className="prize_container">
                            <div className="prize_box">
                                <div className={`prize_pic ${result === '' && "prize_locked"}`}>
                                    <img src="https://pgw.udn.com.tw/gw/photo.php?u=https://event.udn.com/bd_game2024/images/prize1.png&nt=1" alt="全聯禮券 $500" />
                                </div>
                                {result === '' && <img src="./images/prize_lock.svg" alt="locked" className="lock_icon" />}
                                <div className={`prize_text ${result === '' && "prize_locked"}`}>
                                    <span className="item_title">占卜獎</span>
                                    <span className="item_note">｜占卜一次</span><br />
                                    <span className="item_info">全聯禮券 $500</span><br />
                                    <span className="item_quota">（30 名）</span>
                                </div>
                            </div>
                            <div className="prize_box">
                                <div className={`prize_pic ${great == 0 && "prize_locked"}`}>
                                    <img src="https://pgw.udn.com.tw/gw/photo.php?u=https://event.udn.com/bd_game2024/images/prize2.png&nt=1" alt="MyCard 10,000點" />
                                </div>
                                {great == 0 && <img src="./images/prize_lock.svg" alt="locked" className="lock_icon" />}
                                <div className={`prize_text ${great == 0 && "prize_locked"}`}>
                                    <span className="item_title">歐皇獎</span>
                                    <span className="item_note">｜抽中大吉</span><br />
                                    <span className="item_info">MyCard 10,000 點</span><br />
                                    <span className="item_quota">（1 名）</span>
                                </div>
                            </div>
                            <div className="prize_box">
                                <div className={`prize_pic ${signCount < 3 && "prize_locked"}`}>
                                    <img src="https://pgw.udn.com.tw/gw/photo.php?u=https://event.udn.com/bd_game2024/images/prize3.png&nt=1" alt="羅技G733電競耳麥" />
                                </div>
                                {signCount < 3 && <img src="./images/prize_lock.svg" alt="locked" className="lock_icon" />}
                                <div className={`prize_text ${signCount < 3 && "prize_locked"}`}>
                                    <span className="item_title">第3天</span>
                                    <span className="item_note">｜簽到 3 次</span><br />
                                    <span className="item_info">羅技 G733 電競耳麥</span><br />
                                    <span className="item_quota">（3 名）</span>
                                </div>
                            </div>
                            <div className="prize_box">
                                <div className={`prize_pic ${signCount < 6 && "prize_locked"}`}>
                                    <img src="https://pgw.udn.com.tw/gw/photo.php?u=https://event.udn.com/bd_game2024/images/prize4.png&nt=1" alt="ROG Scope II 96 機械鍵盤" />
                                </div>
                                {signCount < 6 && <img src="./images/prize_lock.svg" alt="locked" className="lock_icon" />}
                                <div className={`prize_text ${signCount < 6 && "prize_locked"}`}>
                                    <span className="item_title">第6天</span>
                                    <span className="item_note">｜簽到 6 次</span><br />
                                    <span className="item_info">ROG Scope II 96 機械鍵盤</span><br />
                                    <span className="item_quota">（2 名）</span>
                                </div>
                            </div>
                            <div className="prize_box">
                                <div className={`prize_pic ${signCount < 10 && "prize_locked"}`}>
                                    <img src="https://pgw.udn.com.tw/gw/photo.php?u=https://event.udn.com/bd_game2024/images/prize5.png&nt=1" alt="i-Rocks T07 人體工學椅" />
                                </div>
                                {signCount < 10 && <img src="./images/prize_lock.svg" alt="locked" className="lock_icon" />}
                                <div className={`prize_text ${signCount < 10 && "prize_locked"}`}>
                                    <span className="item_title">第10天</span>
                                    <span className="item_note">｜簽到 10 次</span><br />
                                    <span className="item_info">i-Rocks T07 人體工學椅</span><br />
                                    <span className="item_quota">（1 名）</span>
                                </div>
                            </div>
                            <div className="prize_box">
                                <div className={`prize_pic ${signCount < 15 && "prize_locked"}`}>
                                    <img src="https://pgw.udn.com.tw/gw/photo.php?u=https://event.udn.com/bd_game2024/images/prize6.png&nt=1" alt="Steam Deck OLED 掌機" />
                                </div>
                                {signCount < 15 && <img src="./images/prize_lock.svg" alt="locked" className="lock_icon" />}
                                <div className={`prize_text ${signCount < 15 && "prize_locked"}`}>
                                    <span className="item_title">第15天</span>
                                    <span className="item_note">｜簽到 15 次</span><br />
                                    <span className="item_info">Steam Deck OLED 掌機</span><br />
                                    <span className="item_quota">（1 名）</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div id="sign_record">
                        <img src="https://pgw.udn.com.tw/gw/photo.php?u=https://event.udn.com/bd_game2024/images/title_record.png&nt=1" alt="簽到紀錄" className="subtitle" />
                        <div className="sign_container">
                            {signArr.map((item, index) => {
                                return <a href="#banner" className="sign_stamp" key={index}>
                                    <img src={`./images/record_${item}.svg`} alt={item} />
                                </a>
                            })}
                        </div>
                    </div>
                    <div className="frame_rect_bottom"></div>
                    <img src="https://pgw.udn.com.tw/gw/photo.php?u=https://event.udn.com/bd_game2024/images/record_left.webp&nt=1" alt="cards" className="cards_left" />
                    <img src="https://pgw.udn.com.tw/gw/photo.php?u=https://event.udn.com/bd_game2024/images/record_right.webp&nt=1" alt="cards" className="cards_right" />
                </section>
                <section id="act2">
                    <div className="frame_rect_top"></div>
                    <div className="act2_title">
                        <p>
                            ACG 主題有獎徵集募集令！<br />活動期間，分享你的冒險故事，成功一篇投稿文章即可獲得抽獎資格。
                        </p>
                    </div>
                    <a href="https://game.udn.com/game/post?utm_source=udn_bd&utm_medium=button_2&utm_campaign=bd_game2024" target="_blank" className="btn_act2">
                        <span>{`前往投稿 >`}</span>
                    </a>
                    <div className="step_wrap">
                        <img src="https://pgw.udn.com.tw/gw/photo.php?u=https://event.udn.com/bd_game2024/images/act2_step1.png&nt=1" alt="前往遊戲角落投稿專區" className="act2_step" />
                        <img src="./images/act2_arrow.svg" alt=">" className="act2_arrow" />
                        <img src="https://pgw.udn.com.tw/gw/photo.php?u=https://event.udn.com/bd_game2024/images/act2_step2.png&nt=1" alt="成功投稿一篇文章" className="act2_step" />
                        <img src="./images/act2_arrow.svg" alt=">" className="act2_arrow" />
                        <img src="https://pgw.udn.com.tw/gw/photo.php?u=https://event.udn.com/bd_game2024/images/act2_step3.png&nt=1" alt="12/11(三)公佈中獎名單" className="act2_step" />
                    </div>
                    <div className="act2_prize">
                        <img src="https://pgw.udn.com.tw/gw/photo.php?u=https://event.udn.com/bd_game2024/images/title_act2_prize.png&nt=1" alt="活動獎勵" className="subtitle" />
                        <div className="prize_box">
                            <div className="prize_pic">
                                <img src="https://pgw.udn.com.tw/gw/photo.php?u=https://event.udn.com/bd_game2024/images/act2_prize.png&nt=1" alt="MyCard 500 點" />
                            </div>
                            <div className="prize_text">
                                <span className="item_info">MyCard 500 點</span><br />
                                <span className="item_quota">（20 名）</span>
                            </div>
                        </div>
                    </div>
                    <div className="frame_rect_bottom"></div>
                </section>
                <section id="info">
                    <div className="frame_rect_top"></div>
                    <img src="https://pgw.udn.com.tw/gw/photo.php?u=https://event.udn.com/bd_game2024/images/title_info.png&nt=1" alt="活動辦法" className="subtitle" />
                    <ul className="info_list">
                        <li>活動時間：<br />即日起至
                            <span> 2024 / 12 / 04<span>（三）</span>10:00</span>
                        </li>
                        <li>中獎公布日期：
                            <span>2024 / 12 / 11<span>（三）</span></span>
                        </li>
                        <li>活動說明</li>
                    </ul>
                    <div className="info_content">
                        <h3>活動 1｜<span>歐氣占卜簽到</span></h3>
                        <ul>
                            <li>活動期間，每一電子信箱（e-mail）或會員帳號，每天皆可進行一次「歐氣占卜」。</li>
                            <li>使用 e-mail 或會員帳號完成一次占卜，即可獲得「<span>全聯禮券 500 元</span>」抽獎資格（共 30 名，抽獎資格不累計）；此外，抽中一次大吉，再獲得「<span>MyCard 10,000 點</span>」抽獎資格（1 名，抽獎資格不累計）</li>
                            <li>使用會員帳號進行占卜，每天還可累計簽到 1 次（每日 00:00 重計），達到指定簽到次數，即可解鎖對應獎勵：
                                <ul>
                                    <li>累積簽到 3 天，獲得「<span>羅技 G733 無線 RGB 炫光電競耳麥</span>」抽獎資格（3 名）；
                                    </li>
                                    <li>累積簽到 6 天，獲得「<span>華碩 ROG Strix Scope II 96 RX 無線光軸電競鍵盤</span>」抽獎資格（2 名）；</li>
                                    <li>累積簽到 10 天，獲得「<span>i-Rocks T07 人體工學椅</span>」抽獎資格（1 名）；</li>
                                    <li>累積簽到 15 天，獲得「<span>Steam Deck OLED 掌上型遊戲機 512GB</span>」抽獎資格（1 名）。</li>
                                </ul>
                            </li>
                        </ul>
                    </div>
                    <div className="info_content">
                        <h3>活動 2｜<span>玩家故事大募集</span></h3>
                        <ul>
                            <li>udn 遊戲角落投稿功能新上線！向所有玩家們開放各類 ACG 主題有獎徵集！</li>
                            <li>活動期間，前往遊戲角落的投稿專區，點擊「我要投稿」按鈕，填妥欄位後點擊「送出」，成功投稿一篇文章，即可獲得「<span>MyCard 500 點</span>」抽獎資格（共 20 名，抽獎資格不累計）。</li>
                            <li>全民皆可參加，不需登 ( 加 ) 入會員。</li>
                        </ul>
                    </div>
                    <div className="frame_rect_bottom"></div>
                </section>
                <div className="others">
                    <h3>請注意</h3>
                    <ul>
                        <li>若發現人為、使用網頁機器人程式或一次性信箱等參與活動，聯合線上得取消其參加或得獎資格。</li>
                        <li>所有獎項（獎品圖示僅供參考）將於活動結束後，由主辦單位以系統隨機抽出，並以 e-mail 或簡訊方式通知領取，請務必確認填寫資訊的真實性與正確性皆無誤。</li>
                        <li>本活動獲獎資格不得重複，每人僅限一次領獎機會（依個人資料為準），均不得重複領獎。</li>
                        <li>若經查核發現，得獎者於活動開獎日前一年內，參與聯合線上活動累計中獎獎項價值超過新台幣 1,000 元（含）以上，將取消本活動之獲獎資格。</li>
                        <li>若使用 Gmail 帳號參加活動，於帳號任意字元間加入小數點，均視為同一個信箱，僅有一次獲（抽）獎資格。例如，已有 123@gmail.com 參加活動，將主動排除 1.23@gmail.com、12.3@gmail.com 等變體信箱。</li>
                        <li>參與本次活動即代表您已充分了解並同意接受個資聲明與注意事項。</li>
                    </ul>
                </div>
                <div className="btn_wrap">
                    <button type="button" className="btn_box" onClick={showDeclare}>
                        <span>個資聲明</span>
                    </button>
                    <button type="button" className="btn_box" onClick={showNotice}>
                        <span>注意事項</span>
                    </button>
                </div>
                <div className="bg_bottom">
                    <img src="https://pgw.udn.com.tw/gw/photo.php?u=https://event.udn.com/bd_game2024/images/bg_bottom.webp&nt=1" alt="cards" />
                </div>
                <footer className="footer">
                    <span>聯合線上公司 著作權所有© udn.com All Rights Reserved.</span>
                </footer>
            </section>
            {hasStarted && <Game />}
        </>
    )
}
