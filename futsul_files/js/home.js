/** ホーム画面 **/
var teamData = [
    {
        teamId: '100',
        teamName: '営業企画部',
        teamNameAbbreviation: '営企'
    },
    {
        teamId: '101',
        teamName: '法人事務部門合同',
        teamNameAbbreviation: '法人事務部門'
    },
    {
        teamId: '102',
        teamName: '人事部',
        teamNameAbbreviation: '人事'
    },
    {
        teamId: '103',
        teamName: '情報システム部',
        teamNameAbbreviation: '情シス'
    },
    {
        teamId: '104',
        teamName: 'デジタルイノベーションＨｕｂ',
        teamNameAbbreviation: 'デジHub'
    },
    {
        teamId: '105',
        teamName: '事務オペレーション部',
        teamNameAbbreviation: '事務オペ'
    },
    {
        teamId: '106',
        teamName: '業務部',
        teamNameAbbreviation: '業務'
    },
    {
        teamId: '107',
        teamName: 'デジタル戦略部',
        teamNameAbbreviation: 'デジ戦'
    },
    {
        teamId: '108',
        teamName: '商品・サービス開発部',
        teamNameAbbreviation: '商サ開発'
    },
    {
        teamId: '109',
        teamName: '地域共創戦略部',
        teamNameAbbreviation: '地域共創戦略'
    },
    {
        teamId: '110',
        teamName: '海外事業企画部',
        teamNameAbbreviation: '海外事業企画'
    },
    {
        teamId: '111',
        teamName: '総合法人業務部',
        teamNameAbbreviation: '総法業'
    },
    {
        teamId: '112',
        teamName: 'サイバー・システムリスク統括部',
        teamNameAbbreviation: 'シスリス'
    },
    {
        teamId: '113',
        teamName: '資産運用部門合同',
        teamNameAbbreviation: '資産運用部門'
    }
];

var tournamentData = [
    {
        tournamentId: '100',
        tournamentName: '2025年度第3回',
        tournamentDate: '2026/01/30'
    },
    {
        tournamentId: '101',
        tournamentName: '2025年度第2回',
        tournamentDate: '2025/10/10'
    },
    {
        tournamentId: '102',
        tournamentName: '2025年度第1回',
        tournamentDate: '2025/07/11'
    }
];

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

function setTeamList(data) {
    const teamList = document.getElementById('hm_teamList');

    if (data.length == 0) {
        return;
    }

    for (let i = 0; i < data.length; i++) {
        const li = `
            <li><a href="./match.html?teamId=${data[i].teamId}" class="hm_teamCard">
                <p class="c_typo_headerXS c_typo_BLK10">${data[i].teamNameAbbreviation}</p>
            </a></li>
        `
        teamList.innerHTML += li;
    }
}

function setTournamentData(data) {
    const tournamentList = document.getElementById('hm_tournamentList');

    if (data.length == 0) {
        return;
    }

    for (let i = 0; i < data.length; i++) {
        const li = `
            <li>
                <div class="hm_textLink"><a href="./match.html?tournamentId=${data[i].tournamentId}">
                        <p class="hm_typo_textLink">${data[i].tournamentName}</p>
                    </a></div>
            </li>
        `

        tournamentList.innerHTML += li;
    }
}