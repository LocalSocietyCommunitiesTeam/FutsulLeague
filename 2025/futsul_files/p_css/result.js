/** 試合結果 **/
window.addEventListener('DOMContentLoaded', function() {
    const scorerCheckbox = document.getElementById('slt_scorerChx');
    const memberSelectbox = document.getElementById('slt_member');
    const scoreInput = document.getElementById('slt_score');
    const confirmBtn = document.getElementById('rlt_confirmBtn');

    scorerCheckbox.addEventListener('change', function () {
        if (this.checked) {
            memberSelectbox.disabled = true;
            scoreInput.disabled = true;
        } else {
            memberSelectbox.disabled = false;
            scoreInput.disabled = false;
        }
    });

    confirmBtn.addEventListener('click', function () {
        const inputGoalDialog1 = document.getElementById('rlt_inputGoalDialog1');
        inputGoalDialog1.getElementsByClassName('c_dialog_backGround')[0].close();
    });
});