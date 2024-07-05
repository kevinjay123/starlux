const inputMonth = document.getElementById('inputMonth');
const selectAirportFrom = document.getElementById('selectAirportFrom');
const selectAirportTo = document.getElementById('selectAirportTo');
const btnSearch = document.getElementById('btnSearch');
const btnMonthPrev = document.getElementById('btnMonthPrev');
const btnMonthNext = document.getElementById('btnMonthNext');
const spanMonth = document.getElementById('spanMonth');
const containerResult = document.getElementById('containerResult');
const containerMonthPrice = document.getElementById('containerMonthPrice');
const containerStatistics = document.getElementById('containerStatistics');
const loaderContainer = document.getElementById('loaderContainer');

function appendAirport(){
  const options = airports.map(airport => {
    return {
      value: airport.code,
      label: airport.name,
      sublabel: `${airport.location}, ${airport.region}`,
      badge: `${airport.code}`
    };
  });

  TailwindHeadless.appendDropdown(selectAirportFrom, {
    options: options,
    darkMode: true,
    multiple: false,
    preselected: ['TPE'],
    onChange: (value) => {
      console.log('Selected value:', value);
    }
  });

  TailwindHeadless.appendDropdown(selectAirportTo, {
    options: options,
    darkMode: true,
    multiple: false,
    preselected: ['KMJ'],
    onChange: (value) => {
      console.log('Selected value:', value);
    }
  });
}

btnSearch.addEventListener('click', () => {
  const inputMonthValue = inputMonth.value;
  const departure = selectAirportFrom.getAttribute('data-selected-value');
  const arrival = selectAirportTo.getAttribute('data-selected-value');
  const departureDate = formatMonthDate(inputMonthValue); // 轉換為 yyyy-MM-dd 格式

  spanMonth.textContent = inputMonthValue;

  // 呼叫 searchFlight 函式，並傳入 departure, arrival, departureDate 參數
  searchFlight(departure, arrival, departureDate);
});

function updateInputMonthValue(offset) {
  const inputMonthValue = inputMonth.value;
  const departure = selectAirportFrom.getAttribute('data-selected-value');
  const arrival = selectAirportTo.getAttribute('data-selected-value');
  const [year, month] = inputMonthValue.split('-');
  const date = new Date(year, month - 1, 1);
  date.setMonth(date.getMonth() + offset);
  const paddedMonth = (date.getMonth() + 1).toString().padStart(2, '0');
  inputMonth.value = `${date.getFullYear()}-${paddedMonth}`.padEnd(7, '-');

  spanMonth.textContent = inputMonth.value;

  searchFlight(departure, arrival, formatMonthDate(inputMonth.value));
}

btnMonthPrev.addEventListener('click', () => {
  updateInputMonthValue(-1);
});

btnMonthNext.addEventListener('click', () => {
  updateInputMonthValue(1);
});

function formatMonthDate(monthValue) {
  // 使用 Date 物件來處理日期
  const [year, month] = monthValue.split('-');
  const date = new Date(year, month - 1, 1); // 將日期設為下個月的第一天
  date.setDate(date.getDate() + 1); // 將日期減去一天，獲得當月的最後一天
  return date.toISOString().split('T')[0]; // 返回 yyyy-MM-dd 格式
}

// 顯示 loading 動畫
function showLoader() {
  loaderContainer.classList.remove('hidden');
}

// 隱藏 loading 動畫
function hideLoader() {
  loaderContainer.classList.add('hidden');
}

function searchFlight(departure, arrival, departureDate) {
  const url = 'https://cors-anywhere.herokuapp.com/https://ecapi.starlux-airlines.com/searchFlight/v2/flights/calendars/monthly';
  const data = {
    cabin: 'eco',
    itineraries: [
      {
        departure,
        arrival,
        departureDate
      }
    ],
    travelers: {
      adt: 1,
      chd: 0,
      inf: 0
    },
    goFareFamilyCode: null,
    corporateCode: 'COBRAND01'
  };

  console.log('url', url);
  console.log('data', data);

  // 清空行事曆並顯示 loading 動畫
  // containerMonthPrice.innerHTML = '';
  // containerStatistics.innerHTML = '';
  showLoader();
  containerResult.classList.remove('hidden');

  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'jx-lang': 'zh-TW',
    },
    body: JSON.stringify(data)
  })
    .then(response => response.json())
    .then(data => {
      console.log(data);
      // 在這裡使用 data 進行後續操作
      renderFlightInfo(data);
      hideLoader();
    })
    .catch(error => {
      console.error('無法取得航班資訊:', error);
      console.log(error);

      // 若是 https://cors-anywhere.herokuapp.com/corsdemo 錯誤，提示需要到 https://cors-anywhere.herokuapp.com/corsdemo 啟用
      if (error.message.includes('See /cors')) {
        logError('請到 https://cors-anywhere.herokuapp.com/corsdemo 啟用 CORS');
      }
      hideLoader();
    });
}

function renderFlightInfo(data) {
  const calendars = data.data.calendars;

  // 生成空的日期格子
  let daysArray = Array(42).fill(null);  // 6週 * 7天 = 42個格子
  let prices = [];

  calendars.forEach(calendar => {
    const date = new Date(calendar.departureDate);
    const dayOfMonth = date.getDate();
    const dayOfWeek = date.getDay();
    
    // 計算這一天是當月的第幾天
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const offset = firstDayOfMonth.getDay();
    const index = offset + dayOfMonth - 1;

    daysArray[index] = calendar;
    if(calendar?.price?.amount) prices.push(calendar.price.amount);
  });

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice = (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(0);

  // 清空並重新生成行事曆
  containerMonthPrice.innerHTML = `
    <div class="text-center font-bold text-white opacity-50 hidden lg:block">Sun</div>
    <div class="text-center font-bold text-white hidden lg:block">Mon</div>
    <div class="text-center font-bold text-white hidden lg:block">Tue</div>
    <div class="text-center font-bold text-white hidden lg:block">Wed</div>
    <div class="text-center font-bold text-white hidden lg:block">Thu</div>
    <div class="text-center font-bold text-white hidden lg:block">Fri</div>
    <div class="text-center font-bold text-white opacity-50 hidden lg:block">Sat</div>
  `;

  daysArray.forEach((calendar, index) => {
    const div = document.createElement('div');
    div.classList.add('border', 'border-gray-600', 'p-2', 'h-24', 'relative', 'flex', 'flex-col', 'justify-center', 'items-center', 'bg-gray-900', 'text-white', 'shadow', 'rounded');

    if (calendar) {
      const date = new Date(calendar.departureDate);
      const dayOfMonth = date.getDate();
      const dayOfWeek = date.getDay();
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const lowPrice = calendar?.price?.amount <= minPrice;
      const available = calendar.status === 'available';
      const priceColor = lowPrice ? 'text-green-500 font-bold ' : calendar?.price?.amount >= maxPrice ? 'text-red-400' : 'text-gray-300';
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Check if it's Saturday or Sunday
      (lowPrice) && div.classList.remove('border-gray-600');
      (lowPrice) && div.classList.add('fire', 'border-primary', 'border-2', 'border-l-8');
      (!available) && div.classList.add('opacity-50');
      div.innerHTML = `
        <div class="absolute top-0 right-0 p-1">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-6 h-6 fill-primary ${lowPrice ? 'block' : 'hidden'}">
            <path d="M7.493 18.5c-.425 0-.82-.236-.975-.632A7.48 7.48 0 0 1 6 15.125c0-1.75.599-3.358 1.602-4.634.151-.192.373-.309.6-.397.473-.183.89-.514 1.212-.924a9.042 9.042 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75A.75.75 0 0 1 15 2a2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23h-.777ZM2.331 10.727a11.969 11.969 0 0 0-.831 4.398 12 12 0 0 0 .52 3.507C2.28 19.482 3.105 20 3.994 20H4.9c.445 0 .72-.498.523-.898a8.963 8.963 0 0 1-.924-3.977c0-1.708.476-3.305 1.302-4.666.245-.403-.028-.959-.5-.959H4.25c-.832 0-1.612.453-1.918 1.227Z" />
          </svg>
        </div>
        <div class="text-3xl text-gray-200 ${isWeekend ? 'opacity-50' : ''}">${dayOfMonth}</div>
        <div class="block lg:hidden text-sm text-gray-400">(${dayNames[dayOfWeek]})</div>
        <div class="flex items-end">
          ${
            (available) ? 
            `<div class="text-lg leading-6 ${priceColor}">
              ${calendar?.price?.amount}
            </div>
            <div class="text-sm text-gray-500">${calendar?.price?.currencyCode}</div>`
            : `<div class="text-base leading-6 text-gray-500">Unavailable</div>`
          }
        </div>
      `;
    } else {
      div.classList.add('invisible', 'hidden', 'lg:block');
    }

    containerMonthPrice.appendChild(div);
  });

  // 更新統計資訊
  containerStatistics.innerHTML = `
  <div class="p-4 rounded-lg shadow-lg">
    <h2 class="text-2xl font-bold mb-4 text-white">Overview</h2>
    <div class="flex">
      <div class="w-full flex flex-col items-center">
        <div class="text-gray-400">Min Price</div>
        <div class="text-green-400 font-semibold text-3xl">${minPrice}</div>
      </div>
      <div class="w-full flex flex-col items-center">
        <div class="text-gray-400">Max Price</div>
        <div class="text-red-400 font-semibold text-3xl">${maxPrice}</div>
      </div>
      <div class="w-full flex flex-col items-center">
        <div class="text-gray-400">Avg Price</div>
        <div class="text-gray-400 font-semibold text-3xl">${avgPrice}</div>
      </div>
    </div>
  </div>
`;

}

// 添加事件監聽器
document.addEventListener("DOMContentLoaded", function() {
  appendAirport();
  // renderFlightInfo(monthly); // for testing
});