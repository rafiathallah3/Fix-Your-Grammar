document.addEventListener('DOMContentLoaded', async () => {
	const input = document.getElementById('apiKey') as HTMLInputElement | null;
	const keybindInput = document.getElementById('keybind') as HTMLInputElement | null;
	const saveBtn = document.getElementById('saveBtn');
	const resetBtn = document.getElementById('resetBtn');
	const resetKeybindBtn = document.getElementById('resetKeybindBtn');

	let pendingKeybind = '';

	try {
		const existing = await window.electronAPI.getApiKey();
		if (input) input.value = existing || '';
	} catch {}

	try {
		const existingKeybind = await window.electronAPI.getKeybind();
		pendingKeybind = existingKeybind || 'Alt+A';
		if (keybindInput) keybindInput.value = pendingKeybind;
	} catch {}

	if (keybindInput) {
		keybindInput.addEventListener('focus', () => {
			keybindInput.classList.add('recording');
			keybindInput.value = 'Press keys...';
		});

		keybindInput.addEventListener('blur', () => {
			keybindInput.classList.remove('recording');
			keybindInput.value = pendingKeybind;
		});

		keybindInput.addEventListener('keydown', (e: KeyboardEvent) => {
			e.preventDefault();
			e.stopPropagation();

			const modifierKeys = ['Control', 'Shift', 'Alt', 'Meta'];
			if (modifierKeys.includes(e.key)) return;

			const parts: string[] = [];
			if (e.ctrlKey) parts.push('Ctrl');
			if (e.altKey) parts.push('Alt');
			if (e.shiftKey) parts.push('Shift');
			if (e.metaKey) parts.push('Super');

			let key = e.key;
			if (key === ' ') key = 'Space';
			else if (key.length === 1) key = key.toUpperCase();
			else if (key.startsWith('Arrow')) key = key;
			else if (['Backspace', 'Delete', 'Enter', 'Tab', 'Escape', 'Home', 'End', 'PageUp', 'PageDown', 'Insert'].includes(key)) { /* keep as-is */ }
			else if (key.startsWith('F') && !isNaN(Number(key.slice(1)))) { /* F1-F24, keep as-is */ }

			parts.push(key);
			pendingKeybind = parts.join('+');
			keybindInput.value = pendingKeybind;
			keybindInput.blur();
		});
	}

	if (resetKeybindBtn && keybindInput) {
		resetKeybindBtn.addEventListener('click', () => {
			pendingKeybind = 'Alt+A';
			keybindInput.value = pendingKeybind;
		});
	}

	if (saveBtn && input) {
		saveBtn.addEventListener('click', async () => {
			const key = input.value.trim();
			await window.electronAPI.setApiKey(key);
			if (pendingKeybind) {
				await window.electronAPI.setKeybind(pendingKeybind);
			}
			saveBtn.textContent = 'Saved!';
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