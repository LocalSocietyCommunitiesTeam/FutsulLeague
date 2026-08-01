/** ホーム画面 **/
var teamData = [
    { teamId: '100', teamName: '営業企画部', teamNameAbbreviation: '営企' },
    { teamId: '101', teamName: '法人事務部門合同', teamNameAbbreviation: '法人事務部門' },
    { teamId: '102', teamName: '人事部', teamNameAbbreviation: '人事' },
    { teamId: '103', teamName: '情報システム部', teamNameAbbreviation: '情シス' },
    { teamId: '104', teamName: 'デジタルイノベーションＨｕｂ', teamNameAbbreviation: 'デジHub' },
    { teamId: '105', teamName: '事務オペレーション部', teamNameAbbreviation: '事務オペ' },
    { teamId: '106', teamName: '業務部', teamNameAbbreviation: '業務' },
    { teamId: '107', teamName: 'デジタル戦略部', teamNameAbbreviation: 'デジ戦' },
    { teamId: '108', teamName: '商品・サービス開発部', teamNameAbbreviation: '商サ開発' },
    { teamId: '109', teamName: '地域共創戦略部', teamNameAbbreviation: '地域共創戦略' },
    { teamId: '110', teamName: '海外事業企画部', teamNameAbbreviation: '海外事業企画' },
    { teamId: '111', teamName: '総合法人業務部', teamNameAbbreviation: '総法業' },
    { teamId: '112', teamName: 'サイバー・システムリスク統括部', teamNameAbbreviation: 'シスリス' },
    { teamId: '113', teamName: '資産運用部門合同', teamNameAbbreviation: '資産運用部門' }
];

var tournamentData = [
    { tournamentId: '103', tournamentName: '2026年度第1回大会', tournamentDate: '2026/07/31' },
    { tournamentId: '100', tournamentName: '2025年度第3回大会', tournamentDate: '2026/01/30' },
    { tournamentId: '101', tournamentName: '2025年度第2回大会', tournamentDate: '2025/10/10' },
    { tournamentId: '102', tournamentName: '2025年度第1回大会', tournamentDate: '2025/07/11' }
];

// DOMContentLoaded イベントハンドラ（アロー関数は不使用）
document.addEventListener('DOMContentLoaded', async function () {
    const teamData = await getTeamData();
    const tournamentData = await getTournamentData();

    setTeamList(teamData);
    setTournamentData(tournamentData);
});

function getTeamData() {
    return teamData;
}

function getTournamentData() {
    return tournamentData;
}

/**
 * チーム一覧をDOMに描画する関数
 * @param {Array} data - チームデータの配列
 */
function setTeamList(data) {
    const teamList = document.getElementById('hm_teamList');
    if (!teamList) return; // 要素が存在しない場合の安全ガード

    const len = data.length; // 配列の長さをキャッシュしてループ内の計算を最適化

    if (len === 0) {
        teamList.innerHTML = `
            <li>
                <p class="c_typo_bodyL c_typo_BLK8 c_typo_align_center">チーム未登録です</p>
            </li>
        `;
    } else {
        // ドキュメントフラグメントを作成（メモリ内でDOMを組み立てて一括描画するため）
        const fragment = document.createDocumentFragment();
        let item;

        for (let i = 0; i < len; i++) {
            item = data[i]; // ループ内の配列アクセスを削減

            const li = document.createElement('li');
            const a = document.createElement('a');
            const p = document.createElement('p');

            a.setAttribute('href', 'javascript:void(0)');
            a.classList.add('hm_teamCard');

            // bindをループ内で毎回行うのはメモリ効率が悪いため、datasetを活用して後述のイベントハンドラで処理
            a.dataset.teamId = item.teamId;
            a.addEventListener('click', clickTeamCard);

            p.classList.add("c_typo_headerXS", "c_typo_BLK10");
            p.innerText = item.teamNameAbbreviation;

            a.appendChild(p);
            li.appendChild(a);
            fragment.appendChild(li); // メモリ上のフラグメントに追加（ブラウザのリフローを発生させない）
        }

        teamList.appendChild(fragment); // 最後に一括で実際のDOMに反映
    }
}

/**
 * チームカードクリック時のハンドラ
 * @param {Event} e - イベントオブジェクト
 */
function clickTeamCard(e) {
    e.preventDefault();
    // ターゲット要素（またはその親）から dataset 経由で teamId を取得
    const tournamentId = e.currentTarget.dataset.tournamentId;
    const teamId = e.currentTarget.dataset.teamId;
    location.href = `./match.html?tournamentId=${tournamentId}&teamId=${teamId}`;
}

/**
 * 大会一覧をDOMに描画する関数
 * @param {Array} data - 大会データの配列
 */
function setTournamentData(data) {
    const recentTournamentName = document.getElementById('hm_recentTournamentName');
    const recentTournamentDate = document.getElementById('hm_recentTournamentDate');
    const tournamentList = document.getElementById('hm_tournamentList');
    const teamCard = document.getElementsByClassName('hm_teamCard');
    if (!tournamentList) return; // 要素が存在しない場合の安全ガード

    recentTournamentName.innerText = data[0].tournamentName;
    recentTournamentDate.innerText = formatDate(data[0].tournamentDate);
    for (let i = 0; i < teamCard.length; i++) {
        teamCard[i].dataset.tournamentId = data[0].tournamentId;
    }

    const len = data.length; // 配列の長さをキャッシュ

    if (len === 1) {
        tournamentList.innerHTML = `
            <li>
                <p class="c_typo_bodyL c_typo_BLK8 c_typo_align_center">過去大会のデータがありません</p>
            </li>
        `;
    } else if (len >= 2) {
        // 文字列結合用の配列を用意
        const htmlBuffer = [];
        let item;

        for (let i = 1; i < len; i++) {
            item = data[i]; // 配列アクセスを最適化

            htmlBuffer.push(
                '<li>',
                '<div class="hm_textLink">',
                '<a href="./match.html?tournamentId=', item.tournamentId, '">',
                '<p class="hm_typo_textLink">', item.tournamentName, '</p>',
                '</a>',
                '</div>',
                '</li>'
            );
        }

        // joinで1つの大きな文字列にしてから、1回だけ innerHTML を書き換える
        tournamentList.innerHTML = htmlBuffer.join('');
    }
}