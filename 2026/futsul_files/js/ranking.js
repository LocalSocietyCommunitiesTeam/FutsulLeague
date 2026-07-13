/** ランキング画面 **/

// キャッシュ変数
let cachedRankingData = null;

// 読み込み完了時の処理
document.addEventListener('DOMContentLoaded', async function () {
    showLoader();

    try {
        // ランキングデータの取得
        cachedRankingData = await fetchRankingData();
        
        if (cachedRankingData) {
            // チームランキングを計算して表示
            const teamRanking = calculateTeamRanking(cachedRankingData);
            renderTeamRanking(teamRanking);
            
            // 個人ランキングを計算して表示
            const personalRanking = calculatePersonalRanking(cachedRankingData);
            renderPersonalRanking(personalRanking);
        }
    } catch (error) {
        console.error("初期化エラー:", error);
    } finally {
        closeLoader();
    }

    // タブ切り替え機能
    initTabSwitching();
});

/**
 * GASからランキングデータを取得する（エラー時はモックデータを返す）
 */
async function fetchRankingData() {
    try {
        const url = new URL(GAS_WEB_APP_URL);
        url.searchParams.append("action", "getRanking");

        const response = await fetch(url.toString());
        if (!response.ok) throw new Error("HTTPエラー! ステータス: " + response.status);

        const result = await response.json();
        if (result.success) return result.data;

        console.warn("GASからのデータ取得失敗。モックデータを使用します:", result.message);
        return getMockRankingData();
    } catch (error) {
        console.warn("通信エラー。モックデータを使用します:", error);
        return getMockRankingData();
    }
}

/**
 * モックデータを返す
 */
function getMockRankingData() {
    return {
        teams: [
            { teamId: "team_001", teamName: "ドラゴンズ", teamNameAbbreviation: "DRG" },
            { teamId: "team_002", teamName: "ライオンズ", teamNameAbbreviation: "LIO" },
            { teamId: "team_003", teamName: "イーグルス", teamNameAbbreviation: "EGL" },
            { teamId: "team_004", teamName: "パイレーツ", teamNameAbbreviation: "PIR" },
            { teamId: "team_005", teamName: "タイガース", teamNameAbbreviation: "TGR" }
        ],
        members: [
            { memberId: "mem_001", memberName: "田中 太郎", teamId: "team_001", teamName: "ドラゴンズ", teamNameAbbreviation: "DRG" },
            { memberId: "mem_002", memberName: "山田 花子", teamId: "team_001", teamName: "ドラゴンズ", teamNameAbbreviation: "DRG" },
            { memberId: "mem_003", memberName: "鈴木 次郎", teamId: "team_002", teamName: "ライオンズ", teamNameAbbreviation: "LIO" },
            { memberId: "mem_004", memberName: "佐藤 美咲", teamId: "team_002", teamName: "ライオンズ", teamNameAbbreviation: "LIO" },
            { memberId: "mem_005", memberName: "伊藤 健太", teamId: "team_003", teamName: "イーグルス", teamNameAbbreviation: "EGL" },
            { memberId: "mem_006", memberName: "渡辺 由美", teamId: "team_003", teamName: "イーグルス", teamNameAbbreviation: "EGL" },
            { memberId: "mem_007", memberName: "中村 拓也", teamId: "team_004", teamName: "パイレーツ", teamNameAbbreviation: "PIR" },
            { memberId: "mem_008", memberName: "小林 由紀", teamId: "team_004", teamName: "パイレーツ", teamNameAbbreviation: "PIR" },
            { memberId: "mem_009", memberName: "加藤 翔太", teamId: "team_005", teamName: "タイガース", teamNameAbbreviation: "TGR" },
            { memberId: "mem_010", memberName: "中田 愛子", teamId: "team_005", teamName: "タイガース", teamNameAbbreviation: "TGR" }
        ],
        matches: [
            // ドラゴンズ vs ライオンズ
            { 
                matchId: "match_001", 
                homeTeamId: "team_001", 
                homeTeamScore: 4,
                awayTeamId: "team_002", 
                awayTeamScore: 2,
                goalScorers: [
                    { memberId: "mem_001", goals: 2 },
                    { memberId: "mem_002", goals: 2 },
                    { memberId: "mem_003", goals: 1 },
                    { memberId: "mem_004", goals: 1 }
                ]
            },
            // イーグルス vs パイレーツ
            { 
                matchId: "match_002", 
                homeTeamId: "team_003", 
                homeTeamScore: 3,
                awayTeamId: "team_004", 
                awayTeamScore: 3,
                goalScorers: [
                    { memberId: "mem_005", goals: 1 },
                    { memberId: "mem_006", goals: 2 },
                    { memberId: "mem_007", goals: 2 },
                    { memberId: "mem_008", goals: 1 }
                ]
            },
            // タイガース vs ドラゴンズ
            { 
                matchId: "match_003", 
                homeTeamId: "team_005", 
                homeTeamScore: 2,
                awayTeamId: "team_001", 
                awayTeamScore: 5,
                goalScorers: [
                    { memberId: "mem_009", goals: 1 },
                    { memberId: "mem_010", goals: 1 },
                    { memberId: "mem_001", goals: 3 },
                    { memberId: "mem_002", goals: 2 }
                ]
            },
            // ライオンズ vs イーグルス
            { 
                matchId: "match_004", 
                homeTeamId: "team_002", 
                homeTeamScore: 2,
                awayTeamId: "team_003", 
                awayTeamScore: 1,
                goalScorers: [
                    { memberId: "mem_003", goals: 1 },
                    { memberId: "mem_004", goals: 1 },
                    { memberId: "mem_005", goals: 1 }
                ]
            },
            // パイレーツ vs タイガース
            { 
                matchId: "match_005", 
                homeTeamId: "team_004", 
                homeTeamScore: 4,
                awayTeamId: "team_005", 
                awayTeamScore: 1,
                goalScorers: [
                    { memberId: "mem_007", goals: 2 },
                    { memberId: "mem_008", goals: 2 },
                    { memberId: "mem_010", goals: 1 }
                ]
            },
            // ドラゴンズ vs イーグルス
            { 
                matchId: "match_006", 
                homeTeamId: "team_001", 
                homeTeamScore: 3,
                awayTeamId: "team_003", 
                awayTeamScore: 2,
                goalScorers: [
                    { memberId: "mem_001", goals: 1 },
                    { memberId: "mem_002", goals: 2 },
                    { memberId: "mem_005", goals: 1 },
                    { memberId: "mem_006", goals: 1 }
                ]
            }
        ]
    };
}

/**
 * チームランキングを計算する
 * 勝ち点 ÷ 試合数 で順位を決定
 */
function calculateTeamRanking(data) {
    if (!data || !data.teams) return [];

    const teamStats = data.teams.map(team => {
        // チームの試合結果を集計
        let wins = 0;
        let draws = 0;
        let losses = 0;
        let totalScore = 0;
        let concededScore = 0;

        if (data.matches) {
            data.matches.forEach(match => {
                if (match.homeTeamId === team.teamId) {
                    if (match.homeTeamScore > match.awayTeamScore) wins++;
                    else if (match.homeTeamScore === match.awayTeamScore) draws++;
                    else losses++;
                    totalScore += match.homeTeamScore;
                    concededScore += match.awayTeamScore;
                } else if (match.awayTeamId === team.teamId) {
                    if (match.awayTeamScore > match.homeTeamScore) wins++;
                    else if (match.awayTeamScore === match.homeTeamScore) draws++;
                    else losses++;
                    totalScore += match.awayTeamScore;
                    concededScore += match.homeTeamScore;
                }
            });
        }

        const gamesPlayed = wins + draws + losses;
        // 勝ち点：勝ち+0.5×引き分け
        const points = wins * 1 + draws * 0.5;
        // 平均勝ち点
        const average = gamesPlayed > 0 ? (points / gamesPlayed).toFixed(2) : 0;

        return {
            teamId: team.teamId,
            teamName: team.teamNameAbbreviation || team.teamName,
            points: points,
            gamesPlayed: gamesPlayed,
            average: parseFloat(average),
            wins: wins,
            draws: draws,
            losses: losses,
            goalDifference: totalScore - concededScore
        };
    });

    // 平均勝ち点でソート（降順）→ ゴール差でソート（降順）
    teamStats.sort((a, b) => {
        if (b.average !== a.average) {
            return b.average - a.average;
        }
        return b.goalDifference - a.goalDifference;
    });

    // 同一スコアの場合は同順位
    let rank = 1;
    for (let i = 0; i < teamStats.length; i++) {
        if (i > 0 && teamStats[i].average !== teamStats[i - 1].average) {
            rank = i + 1;
        }
        teamStats[i].rank = rank;
    }

    return teamStats;
}

/**
 * 個人ランキングを計算する
 */
function calculatePersonalRanking(data) {
    if (!data || !data.members) return [];

    const memberStats = data.members.map(member => {
        // メンバーのスコアを集計
        let totalScore = 0;

        if (data.matches) {
            data.matches.forEach(match => {
                if (match.goalScorers) {
                    match.goalScorers.forEach(goalScorer => {
                        if (goalScorer.memberId === member.memberId) {
                            totalScore += goalScorer.goals || 1;
                        }
                    });
                }
            });
        }

        return {
            memberId: member.memberId,
            memberName: member.memberName,
            teamName: member.teamName || member.teamNameAbbreviation,
            score: totalScore
        };
    });

    // スコアでソート（降順）
    memberStats.sort((a, b) => b.score - a.score);

    // 同一スコアの場合は同順位
    let rank = 1;
    for (let i = 0; i < memberStats.length; i++) {
        if (i > 0 && memberStats[i].score !== memberStats[i - 1].score) {
            rank = i + 1;
        }
        memberStats[i].rank = rank;
    }

    return memberStats;
}

/**
 * チームランキングを描画する
 */
function renderTeamRanking(teamRanking) {
    const list = document.getElementById('rk_teamList');
    const emptyMessage = document.getElementById('rk_teamEmptyMessage');

    if (!list) return;

    if (teamRanking.length === 0) {
        list.classList.add('rk_hidden');
        emptyMessage.classList.remove('rk_hidden');
        return;
    }

    let html = '';
    const medalEmojis = ['🥇', '🥈', '🥉'];

    teamRanking.forEach((team, index) => {
        const rankDisplay = index < 3 ? medalEmojis[index] : team.rank;
        const rankClass = index < 3 ? 'rk_rank_medal' : 'rk_rank';
        const rankTextClass = index < 3 ? '' : 'rk_rank_text';

        html += `
            <li class="rk_listItem">
                <div class="${rankClass}">
                    <span class="${rankTextClass}">${rankDisplay}</span>
                </div>
                <div class="rk_content">
                    <p class="c_typo_bodyM rk_name">${team.teamName}</p>
                    <div class="rk_stats">
                        <div class="rk_stat">
                            <span class="rk_statLabel">平均勝ち点</span>
                            <span class="rk_statValue">${team.average}</span>
                        </div>
                        <div class="rk_stat">
                            <span class="rk_statLabel">試合数</span>
                            <span class="rk_statValue">${team.gamesPlayed}</span>
                        </div>
                        <div class="rk_stat">
                            <span class="rk_statLabel">勝</span>
                            <span class="rk_statValue">${team.wins}</span>
                        </div>
                        <div class="rk_stat">
                            <span class="rk_statLabel">引</span>
                            <span class="rk_statValue">${team.draws}</span>
                        </div>
                        <div class="rk_stat">
                            <span class="rk_statLabel">負</span>
                            <span class="rk_statValue">${team.losses}</span>
                        </div>
                    </div>
                </div>
            </li>
        `;
    });

    list.innerHTML = html;
    list.classList.remove('rk_hidden');
    emptyMessage.classList.add('rk_hidden');
}

/**
 * 個人ランキングを描画する
 */
function renderPersonalRanking(personalRanking) {
    const list = document.getElementById('rk_personalList');
    const emptyMessage = document.getElementById('rk_personalEmptyMessage');

    if (!list) return;

    if (personalRanking.length === 0) {
        list.classList.add('rk_hidden');
        emptyMessage.classList.remove('rk_hidden');
        return;
    }

    let html = '';
    const medalEmojis = ['🥇', '🥈', '🥉'];

    personalRanking.forEach((member, index) => {
        const rankDisplay = index < 3 ? medalEmojis[index] : member.rank;
        const rankClass = index < 3 ? 'rk_rank_medal' : 'rk_rank';
        const rankTextClass = index < 3 ? '' : 'rk_rank_text';

        html += `
            <li class="rk_listItem">
                <div class="${rankClass}">
                    <span class="${rankTextClass}">${rankDisplay}</span>
                </div>
                <div class="rk_content">
                    <p class="c_typo_bodyM rk_name">${member.memberName}</p>
                    <p class="c_typo_bodyXS" style="color: #9B9B9B;">${member.teamName}</p>
                </div>
                <div class="rk_score">
                    <span class="rk_scoreLabel">得点</span>
                    <span class="rk_scoreValue">${member.score}</span>
                </div>
            </li>
        `;
    });

    list.innerHTML = html;
    list.classList.remove('rk_hidden');
    emptyMessage.classList.add('rk_hidden');
}

/**
 * タブ切り替え機能
 */
function initTabSwitching() {
    const tabs = document.querySelectorAll('.rk_tab');
    const sections = document.querySelectorAll('.rk_section');

    tabs.forEach(tab => {
        tab.addEventListener('click', function () {
            const targetTab = this.getAttribute('data-tab');

            // すべてのタブと セクションの状態をリセット
            tabs.forEach(t => t.classList.remove('rk_tab_active'));
            sections.forEach(s => s.classList.remove('rk_section_active'));

            // クリックされたタブをアクティブに
            this.classList.add('rk_tab_active');

            // 対応するセクションをアクティブに
            if (targetTab === 'team') {
                document.getElementById('rk_teamSection').classList.add('rk_section_active');
            } else if (targetTab === 'personal') {
                document.getElementById('rk_personalSection').classList.add('rk_section_active');
            }
        });
    });
}
