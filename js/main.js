const inputMonth = document.getElementById('inputMonth');
const selectAirportFrom = document.getElementById('selectAirportFrom');
const selectAirportTo = document.getElementById('selectAirportTo');
const btnSearch = document.getElementById('btnSearch');
const btnMonthPrev = document.getElementById('btnMonthPrev');
const btnMonthNext = document.getElementById('btnMonthNext');
const spanMonth = document.getElementById('spanMonth');
const containerMonthPrice = document.getElementById('containerMonthPrice');
const containerStatistics = document.getElementById('containerStatistics');

// 這裡的 data.airport 是從 settings.js 中取得的資料
airports.forEach(airport => {
  const option = document.createElement('option');
  option.value = airport.code;
  option.text = `${airport.name} (${airport.code})`;
  selectAirportFrom.appendChild(option);
  const option2 = document.createElement('option');
  option2.value = airport.code;
  option2.text = `${airport.name} (${airport.code})`;
  selectAirportTo.appendChild(option2);
});

// set selectAirportFrom default
selectAirportFrom.value = 'TPE';
// set selectAirportTo default
selectAirportTo.value = 'OKA';

btnSearch.addEventListener('click', () => {
  const departure = selectAirportFrom.value;
  const arrival = selectAirportTo.value;
  const inputMonthValue = inputMonth.value;
  const departureDate = formatDate(inputMonthValue); // Convert to yyyy-MM-dd format

  spanMonth.textContent = inputMonthValue;

  // 呼叫 searchFlight 函式，並傳入 departure, arrival, departureDate 參數
  searchFlight(departure, arrival, departureDate);
});

function updateInputMonthValue(offset) {
  const inputMonthValue = inputMonth.value;
  const [year, month] = inputMonthValue.split('-');
  const date = new Date(year, month - 1, 1);
  date.setMonth(date.getMonth() + offset);
  const paddedMonth = (date.getMonth() + 1).toString().padStart(2, '0');
  inputMonth.value = `${date.getFullYear()}-${paddedMonth}`.padEnd(7, '-');

  spanMonth.textContent = inputMonth.value;

  searchFlight(selectAirportFrom.value, selectAirportTo.value, formatDate(inputMonth.value));
}

btnMonthPrev.addEventListener('click', () => {
  updateInputMonthValue(-1);
});

btnMonthNext.addEventListener('click', () => {
  updateInputMonthValue(1);
});

function formatDate(monthValue) {
  // 使用 Date 物件來處理日期
  const [year, month] = monthValue.split('-');
  const date = new Date(year, month, 1); // 將日期設為當月的第一天
  return date.toISOString().split('T')[0]; // 返回 yyyy-MM-dd 格式
}

// needed to request on https://cors-anywhere.herokuapp.com/corsdemo
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
    })
    .catch(error => {
      console.error('無法取得航班資訊:', error);
      console.log(error);

      // 若是 https://cors-anywhere.herokuapp.com/corsdemo 錯誤，提示需要到 https://cors-anywhere.herokuapp.com/corsdemo 啟用
      if (error.message.includes('See /cors')) {
        logError('請到 https://cors-anywhere.herokuapp.com/corsdemo 啟用 CORS');
      }
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
    prices.push(calendar.price.amount);
  });

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice = (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(0);

  // 清空並重新生成行事曆
  containerMonthPrice.innerHTML = `
    <div class="text-center font-bold text-white">日</div>
    <div class="text-center font-bold text-white">一</div>
    <div class="text-center font-bold text-white">二</div>
    <div class="text-center font-bold text-white">三</div>
    <div class="text-center font-bold text-white">四</div>
    <div class="text-center font-bold text-white">五</div>
    <div class="text-center font-bold text-white">六</div>
  `;

  daysArray.forEach((calendar, index) => {
    const div = document.createElement('div');
    div.classList.add('border', 'border-gray-600', 'p-2', 'h-24', 'flex', 'flex-col', 'justify-center', 'items-center', 'bg-gray-900', 'text-white', 'shadow', 'rounded');

    if (calendar) {
      const priceColor = calendar.price.amount <= minPrice ? 'text-green-500' : calendar.price.amount >= maxPrice ? 'text-red-400' : 'text-gray-300';
      (calendar.price.amount <= minPrice) && div.classList.add('fire');
      div.innerHTML = `
        <div class="text-sm text-gray-300">${calendar.departureDate}</div>
        <div class="flex items-end">
          <div class="text-3xl font-bold leading-6 ${priceColor}">
            ${calendar.price.amount}
          </div>
          <div class="text-sm">${calendar.price.currencyCode}</div>
        </div>
        <div class="text-sm ${calendar.status === 'available' ? 'text-green-500' : 'text-red-500'}">${calendar.status}</div>
      `;
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


document.addEventListener("DOMContentLoaded", function() {
  // renderFlightInfo(monthly);
});