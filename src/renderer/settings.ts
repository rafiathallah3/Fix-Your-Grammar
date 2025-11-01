document.addEventListener('DOMContentLoaded', async () => {
	const input = document.getElementById('apiKey') as HTMLInputElement | null;
	const saveBtn = document.getElementById('saveBtn');
	const resetBtn = document.getElementById('resetBtn');

	try {
		const existing = await window.electronAPI.getApiKey();
		if (input) input.value = existing || '';
	} catch {}

	if (saveBtn && input) {
		saveBtn.addEventListener('click', async () => {
			const key = input.value.trim();
			await window.electronAPI.setApiKey(key);
			saveBtn.textContent = 'Saved';
			setTimeout(() => (saveBtn.textContent = 'Save'), 1200);
		});
	}

	if (resetBtn) {
		resetBtn.addEventListener('click', async () => {
			await window.electronAPI.resetMainWindow();
			resetBtn.textContent = 'Reset!';
			setTimeout(() => (resetBtn.textContent = 'Reset Main Window'), 1200);
		});
	}
}); 