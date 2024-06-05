/*
This is a simple dropdown component that can be appended to any element on the page.

Usage:
document.addEventListener('DOMContentLoaded', function() {
  const dropdown = TailwindHeadless.appendDropdown('#dropdown-container', {
    options: [
      { value: 'option1', label: 'Option 1', sublabel: 'Details 1', badge: 'New' },
      { value: 'option2', label: 'Option 2', sublabel: 'Details 2', badge: 'Hot', disabled: true },
      { value: 'option3', label: 'Option 3', sublabel: 'Details 3' }
    ],
    darkMode: false,
    multiple: true,
    preselected: ['option1'],
    onChange: (value) => {
      console.log('Selected value:', value);
    }
  });

  console.log('Selected values:', dropdown.getSelectedValues());
});
*/

(function(global) {
  function createDropdown({ options, darkMode = false, multiple = false, preselected = null, onChange = null, target }) {
    const container = document.createElement('div');
    container.className = 'relative inline-block w-full';

    const button = document.createElement('button');
    button.className = `
      ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}
      w-full border border-gray-700 hover:border-gray-500 px-4 py-2 rounded shadow leading-tight focus:outline-none focus:shadow-outline inline-flex justify-between items-center
    `;
    button.innerHTML = `Select an option
      <svg class="fill-current h-4 w-4 ml-2" viewBox="0 0 20 20">
        <path d="M7 10l5 5 5-5H7z"/>
      </svg>`;

    const dropdown = document.createElement('div');
    dropdown.className = `
      absolute w-full mt-1 rounded shadow-lg z-10 max-h-96 overflow-y-auto border border-gray-700
      ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}
    `;
    dropdown.style.display = 'none';

    const selectedOptions = [];

    function updateButtonContent(option) {
      const labelDiv = document.createElement('div');
      labelDiv.className = 'flex flex-col items-start text-left';

      const label = document.createElement('span');
      label.textContent = option.label;
      labelDiv.appendChild(label);

      if (option.sublabel) {
        const sublabel = document.createElement('span');
        sublabel.className = 'text-sm text-gray-500';
        sublabel.textContent = option.sublabel;
        labelDiv.appendChild(sublabel);
      }

      button.innerHTML = '';
      button.appendChild(labelDiv);

      if (option.badge) {
        const badge = document.createElement('span');
        badge.className = `
          ml-2 px-2 py-1 rounded-full text-xs
          ${darkMode ? 'bg-gray-600 text-white' : 'bg-gray-200 text-gray-800'}
        `;
        badge.textContent = option.badge;
        button.appendChild(badge);
      }

      const arrow = document.createElement('svg');
      arrow.className = 'fill-current h-4 w-4 ml-2';
      arrow.setAttribute('viewBox', '0 0 20 20');
      arrow.innerHTML = '<path d="M7 10l5 5 5-5H7z"/>';
      button.appendChild(arrow);
    }

    options.forEach(option => {
      const optionElement = document.createElement('div');
      optionElement.className = `
        px-4 py-2 flex justify-between items-center
        ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}
        ${option.disabled ? 'cursor-not-allowed opacity-30' : 'cursor-pointer'}
      `;

      const labelDiv = document.createElement('div');
      labelDiv.className = 'flex flex-col items-start text-left';

      const label = document.createElement('span');
      label.textContent = option.label;
      labelDiv.appendChild(label);

      if (option.sublabel) {
        const sublabel = document.createElement('span');
        sublabel.className = 'text-sm text-gray-500';
        sublabel.textContent = option.sublabel;
        labelDiv.appendChild(sublabel);
      }
      optionElement.appendChild(labelDiv);

      if (option.badge) {
        const badge = document.createElement('span');
        badge.className = `
          ml-2 px-2 py-1 rounded-full text-xs
          ${darkMode ? 'bg-gray-600 text-white' : 'bg-gray-200 text-gray-800'}
        `;
        badge.textContent = option.badge;
        optionElement.appendChild(badge);
      }

      if (preselected && preselected.includes(option.value)) {
        selectedOptions.push(option.value);
        updateButtonContent(option);
        target.setAttribute('data-selected-value', option.value);
      }

      optionElement.addEventListener('click', () => {
        if (!option.disabled) {
          if (multiple) {
            if (selectedOptions.includes(option.value)) {
              const index = selectedOptions.indexOf(option.value);
              selectedOptions.splice(index, 1);
            } else {
              selectedOptions.push(option.value);
            }
            button.innerHTML = `${selectedOptions.join(', ') || 'Select options'}
              <svg class="fill-current h-4 w-4 ml-2" viewBox="0 0 20 20">
                <path d="M7 10l5 5 5-5H7z"/>
              </svg>`;
          } else {
            selectedOptions.length = 0;
            selectedOptions.push(option.value);
            updateButtonContent(option);
            dropdown.style.display = 'none';
            target.setAttribute('data-selected-value', option.value);
            if (onChange) onChange(option.value);
          }
        }
      });
      dropdown.appendChild(optionElement);
    });

    button.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    });

    document.addEventListener('click', () => {
      dropdown.style.display = 'none';
    });

    container.appendChild(button);
    container.appendChild(dropdown);

    return { container, selectedOptions };
  }

  function appendDropdown(target, config) {
    const dropdownConfig = { ...config, target };
    const dropdown = createDropdown(dropdownConfig);
    if (typeof target === 'string') {
      document.querySelector(target).appendChild(dropdown.container);
    } else if (target instanceof HTMLElement) {
      target.appendChild(dropdown.container);
    } else {
      throw new Error('Target must be a selector string or a DOM element.');
    }
    return {
      getSelectedValues: () => target.getAttribute('data-selected-value'),
    };
  }

  global.TailwindHeadless = {
    appendDropdown,
  };
})(window);
