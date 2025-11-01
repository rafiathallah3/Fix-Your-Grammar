document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function truncateText(text: string, maxLength: number = 100): string {
    if (text.length <= maxLength) {
        return text;
    }
    return text.substring(0, maxLength) + '...';
}

async function initializeApp(): Promise<void> {
    const tombolPerbaikan = document.getElementById('tombol-perbaikan');
    const tombolImprove = document.getElementById('tombol-improve');
    const textDiPilihElement = document.getElementById('text-dipilih');
    let textPerbaikan = "";
    let textImprove = "";
    
    let tombolPerbaikanClicked = false;
    let tombolImproveClicked = false;

    function UlanginClick(status: "perbaikan" | "improve") {
        if(status === "perbaikan") {
            tombolPerbaikanClicked = false;
            tombolPerbaikan!.style.border = 'none';
        } else {
            tombolImproveClicked = false;
            tombolImprove!.style.border = 'none';
        }
    }

    window.electronAPI.onSelectedText((text: string, status: "textDiPilih" | "textPerbaikan" | "textImprove") => {
        text = text.trim();
        if(status === "textDiPilih") {
            if (!textDiPilihElement) {
                return;
            }

            textDiPilihElement.textContent = text;

            return;
        }

        if(status === "textPerbaikan") {
            if (!tombolPerbaikan) {
                return;
            }

            if(text !== "") {
                tombolPerbaikan.textContent = truncateText(text);
            } else {
                tombolPerbaikan.innerHTML = `
                <div class="loading-dots">
                    <div class="dot"></div>
                    <div class="dot"></div>
                    <div class="dot"></div>
                </div>
                `;                
            }
            textPerbaikan = text;
        }

        if(status === "textImprove") {
            if (!tombolImprove) {
                return;
            }

            if(text !== "") {
                tombolImprove.textContent = truncateText(text);
            } else {
                tombolImprove.innerHTML = `
                <div class="loading-dots">
                    <div class="dot"></div>
                    <div class="dot"></div>
                    <div class="dot"></div>
                </div>
                `;                
            }

            textImprove = text;
        }
    });

    if (tombolPerbaikan && textDiPilihElement) {
        tombolPerbaikan.addEventListener("click", () => {
            if(textPerbaikan === "") {
                return;
            }

            UlanginClick("improve");

            if (!tombolPerbaikanClicked) {
                textDiPilihElement.textContent = textPerbaikan;
                tombolPerbaikan.style.border = '1px solid #60a5fa';
                tombolPerbaikanClicked = true;
            } else {
                window.electronAPI.pilihText(textPerbaikan);
                UlanginClick("perbaikan");
            }
        });
    }

    if (tombolImprove && textDiPilihElement) {
        tombolImprove.addEventListener('click', () => {
            if(textImprove === "") {
                return;
            }

            UlanginClick("perbaikan");

            tombolPerbaikanClicked = false;
            if (!tombolImproveClicked) {
                textDiPilihElement.textContent = textImprove;
                tombolImprove.style.border = '1px solid #60a5fa';
                tombolImproveClicked = true;
            } else {
                UlanginClick("improve");
                window.electronAPI.pilihText(textImprove);
            }
        });
    }
} 