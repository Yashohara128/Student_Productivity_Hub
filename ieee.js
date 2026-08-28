// ieee.js - Separate Module for IEEE Citation Generator

export function initIEEEModule() {
    const cardIeee = document.getElementById('card-ieee');
    const viewIeee = document.getElementById('view-ieee');
    const backToHubIeee = document.getElementById('back-to-hub-ieee');
    const ieeeSourceType = document.getElementById('ieee-source-type');
    const ieeeSourceLabel = document.getElementById('ieee-source-label');
    const ieeeUrlBox = document.getElementById('ieee-url-box');
    const generateIeeeBtn = document.getElementById('generate-ieee-btn');
    const ieeeResultSection = document.getElementById('ieee-result-section');
    const ieeeOutputText = document.getElementById('ieee-output-text');
    const copyIeeeBtn = document.getElementById('copy-ieee-btn');

    if (cardIeee && viewIeee) {
        cardIeee.addEventListener('click', () => {
            document.getElementById('dashboard-hub').style.display = 'none';
            if (document.getElementById('view-gpa')) document.getElementById('view-gpa').style.display = 'none';
            if (document.getElementById('view-shortnotes')) document.getElementById('view-shortnotes').style.display = 'none';
            if (document.getElementById('view-plagiarism')) document.getElementById('view-plagiarism').style.display = 'none';
            viewIeee.style.display = 'block';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    if (backToHubIeee) {
        backToHubIeee.addEventListener('click', () => {
            viewIeee.style.display = 'none';
            document.getElementById('dashboard-hub').style.display = 'block';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    if (ieeeSourceType) {
        ieeeSourceType.addEventListener('change', (e) => {
            const val = e.target.value;
            if (val === 'journal') ieeeSourceLabel.innerText = "Journal Name:";
            else if (val === 'book') ieeeSourceLabel.innerText = "Publisher / Location:";
            else if (val === 'conference') ieeeSourceLabel.innerText = "Conference Proceedings Name:";
            else if (val === 'website') ieeeSourceLabel.innerText = "Website Name / Publisher:";

            if (val === 'website') ieeeUrlBox.style.display = 'block';
            else ieeeUrlBox.style.display = 'none';
        });
    }

    if (generateIeeeBtn) {
        generateIeeeBtn.addEventListener('click', () => {
            const type = ieeeSourceType.value;
            const author = document.getElementById('ieee-author').value.trim();
            const title = document.getElementById('ieee-title').value.trim();
            const source = document.getElementById('ieee-source').value.trim();
            const year = document.getElementById('ieee-year').value.trim();
            const url = document.getElementById('ieee-url') ? document.getElementById('ieee-url').value.trim() : "";

            if (!author || !title || !source || !year) {
                alert("⚠️ Please fill all required fields!");
                return;
            }

            let formattedRef = "";
            const currentDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

            switch (type) {
                case 'journal':
                    formattedRef = `${author}, "${title}," *${source}*, vol. X, no. X, pp. XX-XX, ${year}.`;
                    break;
                case 'book':
                    formattedRef = `${author}, *${title}*. ${source}, ${year}.`;
                    break;
                case 'conference':
                    formattedRef = `${author}, "${title}," in *Proc. ${source}*, ${year}, pp. XX-XX.`;
                    break;
                case 'website':
                    formattedRef = `${author}, "${title}," ${source}, ${year}. [Online]. Available: ${url}. [Accessed: ${currentDate}].`;
                    break;
            }

            ieeeOutputText.value = formattedRef;
            ieeeResultSection.style.display = 'block';
        });
    }

    if (copyIeeeBtn) {
        copyIeeeBtn.addEventListener('click', () => {
            ieeeOutputText.select();
            navigator.clipboard.writeText(ieeeOutputText.value);
            alert("📋 IEEE reference copied to clipboard!");
        });
    }
}
