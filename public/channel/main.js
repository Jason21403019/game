const init = () => {
    const event = "bd_game2024";
    const eventEnd = new Date("2024-12-04 10:00:00");

    if (window.location.href.includes(event) && (new Date() <= eventEnd)) {
        Swal.fire({
            customClass: {
                container: "game2024_box"
            },
            showCloseButton: true,
            confirmButtonText: "確定",
            html: `<img src="https://pgw.udn.com.tw/gw/photo.php?u=https://event.udn.com/bd_game2024/images/channel/title.png" alt="玩家故事大募集" class="game2024_box_title" /><p class="game2024_box_desc">你心中有想分享的 ACG 冒險故事嗎？即日起至 12/4（三），只要點擊「我要投稿」按鈕，成功投稿一篇文章，即可獲得「MyCard 500 點」抽獎資格。</p>`,
        })
    }
}

document.addEventListener('DOMContentLoaded', init);