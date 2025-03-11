const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const loopTimeInput = document.getElementById('loopTimeInput');

// Các biến lưu trạng thái
let isDpiRunning = false;
let dpiIntervalId = null;
let devicesList = [];
let selectedDevices = []; // Danh sách các thiết bị được chọn
let timeZonesList = [];
let autoTimeUpdate = true; // Biến để kiểm soát việc cập nhật thời gian tự động

// Khai báo các elements
const homeButton = document.getElementById('homeButton');
const enable4gButton = document.getElementById('enable4gButton');
const disable4gButton = document.getElementById('disable4gButton');
const enableTimeButton = document.getElementById('enableTimeButton');
const regionSelect = document.getElementById('regionSelect');
const regionList = document.getElementById('regionList');
const saveRegionButton = document.getElementById('saveRegionButton');
const dateInput = document.getElementById('dateInput');
const timeInput = document.getElementById('timeInput');
const saveTimeButton = document.getElementById('saveTimeButton');
const dpiInput1 = document.getElementById('dpiInput1');
const dpiInput2 = document.getElementById('dpiInput2');
const dpiButton = document.getElementById('dpiButton');
const statusElement = document.getElementById('status');
const deviceSelector = document.getElementById('deviceSelector'); // Phần tử để chọn thiết bị
const refreshAllDevicesButton = document.getElementById('refreshAllDevicesButton'); // Nút làm mới danh sách thiết bị
const deviceList = document.getElementById('deviceList'); // Container cho danh sách thiết bị với checkbox

// Hàm hiển thị trạng thái
function showStatus(message, isError = false) {
  statusElement.innerHTML = `<div style="color: ${isError ? 'red' : 'green'}; padding: 10px;">${message}</div>`;
}

// Hàm lấy danh sách thiết bị
async function getConnectedDevices() {
  try {
    const { stdout } = await execPromise('adb devices');
    const lines = stdout.trim().split('\n').slice(1);
    return lines
      .filter(line => line.includes('device') && !line.includes('attached'))
      .map(line => line.split('\t')[0]);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách thiết bị:', error);
    return [];
  }
}

// Hàm cập nhật danh sách thiết bị dưới dạng checkbox
async function updateDeviceList() {
  devicesList = await getConnectedDevices();
  
  if (!deviceList) {
    console.error('Không tìm thấy phần tử deviceList');
    return;
  }
  
  // Lưu lại danh sách thiết bị đã chọn trước đó
  const previousSelectedDevices = new Set(selectedDevices);
  
  // Xóa nội dung hiện tại
  deviceList.innerHTML = '';
  
  // Thêm các thiết bị vào danh sách với checkbox
  if (devicesList.length === 0) {
    deviceList.innerHTML = '<div style="color: red; padding: 10px;">Không tìm thấy thiết bị nào. Hãy kết nối thiết bị và thử lại.</div>';
    showStatus('Không tìm thấy thiết bị nào. Hãy kết nối thiết bị và thử lại.', true);
    
    // Xóa danh sách thiết bị đã chọn
    selectedDevices = [];
    updateSelectedDevicesInfo();
  } else {
    // Cập nhật danh sách thiết bị với checkbox
    devicesList.forEach(deviceId => {
      const deviceItem = document.createElement('div');
      deviceItem.className = 'device-item';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `device-${deviceId}`;
      checkbox.value = deviceId;
      checkbox.checked = previousSelectedDevices.has(deviceId); // Giữ trạng thái đã chọn
      checkbox.addEventListener('change', updateSelectedDevices);
      
      const label = document.createElement('label');
      label.htmlFor = `device-${deviceId}`;
      label.textContent = deviceId;
      
      deviceItem.appendChild(checkbox);
      deviceItem.appendChild(label);
      deviceList.appendChild(deviceItem);
    });
    
    // Cập nhật lại danh sách thiết bị đã chọn (giữ lại các thiết bị vẫn còn kết nối)
    selectedDevices = selectedDevices.filter(device => devicesList.includes(device));
    if (selectedDevices.length === 0 && devicesList.length > 0) {
      // Nếu không còn thiết bị nào được chọn mà có thiết bị kết nối, tự động chọn thiết bị đầu tiên
      selectedDevices = [devicesList[0]];
      const firstCheckbox = document.querySelector(`#device-${devicesList[0]}`);
      if (firstCheckbox) {
        firstCheckbox.checked = true;
      }
    }
    
    updateSelectedDevicesInfo();
    showStatus(`Đã tìm thấy ${devicesList.length} thiết bị. Đã chọn: ${selectedDevices.length} thiết bị.`);
  }
}

// Cập nhật danh sách thiết bị vào selector (phiên bản cũ, giữ lại để tương thích)
async function updateDeviceSelector() {
  devicesList = await getConnectedDevices();
  
  if (!deviceSelector) {
    console.error('Không tìm thấy phần tử deviceSelector');
    return;
  }
  
  // Xóa các tùy chọn cũ
  deviceSelector.innerHTML = '';
  
  // Thêm các thiết bị vào selector
  if (devicesList.length === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'Không tìm thấy thiết bị';
    deviceSelector.appendChild(option);
    showStatus('Không tìm thấy thiết bị nào. Hãy kết nối thiết bị và thử lại.', true);
  } else {
    devicesList.forEach(deviceId => {
      const option = document.createElement('option');
      option.value = deviceId;
      option.textContent = deviceId;
      deviceSelector.appendChild(option);
    });
    
    // Cập nhật danh sách thiết bị được chọn
    selectedDevices = [devicesList[0]];
    deviceSelector.value = selectedDevices[0];
    
    // Cập nhật thông tin thiết bị được chọn hiển thị
    updateSelectedDevicesInfo();
  }
  
  // Cập nhật danh sách thiết bị dạng checkbox
  updateDeviceList();
}

// Cập nhật thông tin về thiết bị đã chọn
function updateSelectedDevicesInfo() {
  const selectedDeviceInfo = document.getElementById('selectedDeviceInfo');
  if (!selectedDeviceInfo) return;
  
  if (selectedDevices.length > 0) {
    selectedDeviceInfo.textContent = `Đã chọn ${selectedDevices.length} thiết bị: ${selectedDevices.join(', ')}`;
    selectedDeviceInfo.style.color = 'green';
  } else {
    selectedDeviceInfo.textContent = 'Chưa chọn thiết bị nào';
    selectedDeviceInfo.style.color = 'red';
  }
}

// Cập nhật danh sách thiết bị được chọn từ checkboxes
function updateSelectedDevices() {
  selectedDevices = [];
  const checkboxes = document.querySelectorAll('#deviceList input[type="checkbox"]:checked');
  
  checkboxes.forEach(checkbox => {
    selectedDevices.push(checkbox.value);
  });
  
  // Cập nhật thông tin thiết bị đã chọn
  updateSelectedDevicesInfo();
}

// Hàm lấy múi giờ và vùng
async function getTimeZones() {
  // Danh sách đầy đủ các múi giờ trên thế giới
  const fullTimeZonesList = [
    // Châu Á
    { name: 'Việt Nam', timezone: 'Asia/Ho_Chi_Minh' },
    { name: 'Thái Lan', timezone: 'Asia/Bangkok' },
    { name: 'Singapore', timezone: 'Asia/Singapore' },
    { name: 'Malaysia', timezone: 'Asia/Kuala_Lumpur' },
    { name: 'Indonesia (Jakarta)', timezone: 'Asia/Jakarta' },
    { name: 'Indonesia (Bali)', timezone: 'Asia/Makassar' },
    { name: 'Philippines', timezone: 'Asia/Manila' },
    { name: 'Nhật Bản', timezone: 'Asia/Tokyo' },
    { name: 'Hàn Quốc', timezone: 'Asia/Seoul' },
    { name: 'Trung Quốc', timezone: 'Asia/Shanghai' },
    { name: 'Hong Kong', timezone: 'Asia/Hong_Kong' },
    { name: 'Đài Loan', timezone: 'Asia/Taipei' },
    { name: 'Ấn Độ', timezone: 'Asia/Kolkata' },
    { name: 'UAE (Dubai)', timezone: 'Asia/Dubai' },
    { name: 'Qatar', timezone: 'Asia/Qatar' },
    { name: 'Saudi Arabia', timezone: 'Asia/Riyadh' },
    { name: 'Iran', timezone: 'Asia/Tehran' },
    { name: 'Iraq', timezone: 'Asia/Baghdad' },
    { name: 'Israel', timezone: 'Asia/Jerusalem' },
    { name: 'Jordan', timezone: 'Asia/Amman' },
    { name: 'Kuwait', timezone: 'Asia/Kuwait' },
    { name: 'Lebanon', timezone: 'Asia/Beirut' },
    { name: 'Oman', timezone: 'Asia/Muscat' },
    { name: 'Pakistan', timezone: 'Asia/Karachi' },
    { name: 'Palestine', timezone: 'Asia/Gaza' },
    { name: 'Syria', timezone: 'Asia/Damascus' },
    { name: 'Yemen', timezone: 'Asia/Aden' },
    { name: 'Afghanistan', timezone: 'Asia/Kabul' },
    { name: 'Armenia', timezone: 'Asia/Yerevan' },
    { name: 'Azerbaijan', timezone: 'Asia/Baku' },
    { name: 'Bahrain', timezone: 'Asia/Bahrain' },
    { name: 'Bangladesh', timezone: 'Asia/Dhaka' },
    { name: 'Bhutan', timezone: 'Asia/Thimphu' },
    { name: 'Brunei', timezone: 'Asia/Brunei' },
    { name: 'Cambodia', timezone: 'Asia/Phnom_Penh' },
    { name: 'Cyprus', timezone: 'Asia/Nicosia' },
    { name: 'Georgia', timezone: 'Asia/Tbilisi' },
    { name: 'Kazakhstan', timezone: 'Asia/Almaty' },
    { name: 'Kyrgyzstan', timezone: 'Asia/Bishkek' },
    { name: 'Laos', timezone: 'Asia/Vientiane' },
    { name: 'Macao', timezone: 'Asia/Macau' },
    { name: 'Maldives', timezone: 'Indian/Maldives' },
    { name: 'Mongolia', timezone: 'Asia/Ulaanbaatar' },
    { name: 'Myanmar', timezone: 'Asia/Yangon' },
    { name: 'Nepal', timezone: 'Asia/Kathmandu' },
    { name: 'North Korea', timezone: 'Asia/Pyongyang' },
    { name: 'Sri Lanka', timezone: 'Asia/Colombo' },
    { name: 'Tajikistan', timezone: 'Asia/Dushanbe' },
    { name: 'Turkmenistan', timezone: 'Asia/Ashgabat' },
    { name: 'Uzbekistan', timezone: 'Asia/Tashkent' },
    
    // Châu Âu
    { name: 'Anh (London)', timezone: 'Europe/London' },
    { name: 'Vương quốc Anh', timezone: 'Europe/London' },
    { name: 'Pháp (Paris)', timezone: 'Europe/Paris' },
    { name: 'Đức (Berlin)', timezone: 'Europe/Berlin' },
    { name: 'Ý (Rome)', timezone: 'Europe/Rome' },
    { name: 'Tây Ban Nha (Madrid)', timezone: 'Europe/Madrid' },
    { name: 'Nga (Moscow)', timezone: 'Europe/Moscow' },
    { name: 'Thụy Điển (Stockholm)', timezone: 'Europe/Stockholm' },
    { name: 'Na Uy (Oslo)', timezone: 'Europe/Oslo' },
    { name: 'Phần Lan (Helsinki)', timezone: 'Europe/Helsinki' },
    { name: 'Đan Mạch (Copenhagen)', timezone: 'Europe/Copenhagen' },
    { name: 'Hà Lan (Amsterdam)', timezone: 'Europe/Amsterdam' },
    { name: 'Bỉ (Brussels)', timezone: 'Europe/Brussels' },
    { name: 'Thụy Sĩ (Zurich)', timezone: 'Europe/Zurich' },
    { name: 'Áo (Vienna)', timezone: 'Europe/Vienna' },
    { name: 'Ba Lan (Warsaw)', timezone: 'Europe/Warsaw' },
    { name: 'Hy Lạp (Athens)', timezone: 'Europe/Athens' },
    { name: 'Albania', timezone: 'Europe/Tirane' },
    { name: 'Andorra', timezone: 'Europe/Andorra' },
    { name: 'Belarus', timezone: 'Europe/Minsk' },
    { name: 'Bosnia và Herzegovina', timezone: 'Europe/Sarajevo' },
    { name: 'Bulgaria', timezone: 'Europe/Sofia' },
    { name: 'Croatia', timezone: 'Europe/Zagreb' },
    { name: 'Estonia', timezone: 'Europe/Tallinn' },
    { name: 'Hungary', timezone: 'Europe/Budapest' },
    { name: 'Iceland', timezone: 'Atlantic/Reykjavik' },
    { name: 'Ireland', timezone: 'Europe/Dublin' },
    { name: 'Latvia', timezone: 'Europe/Riga' },
    { name: 'Liechtenstein', timezone: 'Europe/Vaduz' },
    { name: 'Lithuania', timezone: 'Europe/Vilnius' },
    { name: 'Luxembourg', timezone: 'Europe/Luxembourg' },
    { name: 'Malta', timezone: 'Europe/Malta' },
    { name: 'Moldova', timezone: 'Europe/Chisinau' },
    { name: 'Monaco', timezone: 'Europe/Monaco' },
    { name: 'Montenegro', timezone: 'Europe/Podgorica' },
    { name: 'Portugal', timezone: 'Europe/Lisbon' },
    { name: 'Romania', timezone: 'Europe/Bucharest' },
    { name: 'San Marino', timezone: 'Europe/San_Marino' },
    { name: 'Serbia', timezone: 'Europe/Belgrade' },
    { name: 'Slovakia', timezone: 'Europe/Bratislava' },
    { name: 'Slovenia', timezone: 'Europe/Ljubljana' },
    { name: 'Ukraine', timezone: 'Europe/Kiev' },
    { name: 'Vatican City', timezone: 'Europe/Vatican' },
    
    // Châu Mỹ
    { name: 'Mỹ (New York)', timezone: 'America/New_York' },
    { name: 'Mỹ (Chicago)', timezone: 'America/Chicago' },
    { name: 'Mỹ (Denver)', timezone: 'America/Denver' },
    { name: 'Mỹ (Los Angeles)', timezone: 'America/Los_Angeles' },
    { name: 'Mỹ (Anchorage)', timezone: 'America/Anchorage' },
    { name: 'Mỹ (Honolulu)', timezone: 'Pacific/Honolulu' },
    { name: 'Hoa Kỳ', timezone: 'America/New_York' },
    { name: 'Canada (Toronto)', timezone: 'America/Toronto' },
    { name: 'Mexico (Mexico City)', timezone: 'America/Mexico_City' },
    { name: 'Brazil (São Paulo)', timezone: 'America/Sao_Paulo' },
    { name: 'Argentina (Buenos Aires)', timezone: 'America/Argentina/Buenos_Aires' },
    { name: 'Chile (Santiago)', timezone: 'America/Santiago' },
    { name: 'Peru (Lima)', timezone: 'America/Lima' },
    { name: 'Colombia (Bogotá)', timezone: 'America/Bogota' },
    { name: 'Antigua và Barbuda', timezone: 'America/Antigua' },
    { name: 'Bahamas', timezone: 'America/Nassau' },
    { name: 'Barbados', timezone: 'America/Barbados' },
    { name: 'Belize', timezone: 'America/Belize' },
    { name: 'Bolivia', timezone: 'America/La_Paz' },
    { name: 'Costa Rica', timezone: 'America/Costa_Rica' },
    { name: 'Cuba', timezone: 'America/Havana' },
    { name: 'Dominica', timezone: 'America/Dominica' },
    { name: 'Dominican Republic', timezone: 'America/Santo_Domingo' },
    { name: 'Cộng hòa Dominica', timezone: 'America/Santo_Domingo' },
    { name: 'Ecuador', timezone: 'America/Guayaquil' },
    { name: 'El Salvador', timezone: 'America/El_Salvador' },
    { name: 'Grenada', timezone: 'America/Grenada' },
    { name: 'Guatemala', timezone: 'America/Guatemala' },
    { name: 'Guyana', timezone: 'America/Guyana' },
    { name: 'Haiti', timezone: 'America/Port-au-Prince' },
    { name: 'Honduras', timezone: 'America/Tegucigalpa' },
    { name: 'Jamaica', timezone: 'America/Jamaica' },
    { name: 'Nicaragua', timezone: 'America/Managua' },
    { name: 'Panama', timezone: 'America/Panama' },
    { name: 'Paraguay', timezone: 'America/Asuncion' },
    { name: 'Puerto Rico', timezone: 'America/Puerto_Rico' },
    { name: 'Saint Kitts and Nevis', timezone: 'America/St_Kitts' },
    { name: 'Saint Lucia', timezone: 'America/St_Lucia' },
    { name: 'Saint Vincent and the Grenadines', timezone: 'America/St_Vincent' },
    { name: 'Suriname', timezone: 'America/Paramaribo' },
    { name: 'Trinidad and Tobago', timezone: 'America/Port_of_Spain' },
    { name: 'Trinidad và Tobago', timezone: 'America/Port_of_Spain' },
    { name: 'Uruguay', timezone: 'America/Montevideo' },
    { name: 'Venezuela', timezone: 'America/Caracas' },
    
    // Châu Đại Dương
    { name: 'Australia (Sydney)', timezone: 'Australia/Sydney' },
    { name: 'Australia (Melbourne)', timezone: 'Australia/Melbourne' },
    { name: 'Australia (Perth)', timezone: 'Australia/Perth' },
    { name: 'Australia (Brisbane)', timezone: 'Australia/Brisbane' },
    { name: 'New Zealand (Auckland)', timezone: 'Pacific/Auckland' },
    { name: 'Fiji', timezone: 'Pacific/Fiji' },
    { name: 'American Samoa', timezone: 'Pacific/Pago_Pago' },
    { name: 'Cook Islands', timezone: 'Pacific/Rarotonga' },
    { name: 'French Polynesia', timezone: 'Pacific/Tahiti' },
    { name: 'Kiribati', timezone: 'Pacific/Tarawa' },
    { name: 'Marshall Islands', timezone: 'Pacific/Majuro' },
    { name: 'Micronesia', timezone: 'Pacific/Chuuk' },
    { name: 'Nauru', timezone: 'Pacific/Nauru' },
    { name: 'New Caledonia', timezone: 'Pacific/Noumea' },
    { name: 'Niue', timezone: 'Pacific/Niue' },
    { name: 'Palau', timezone: 'Pacific/Palau' },
    { name: 'Papua New Guinea', timezone: 'Pacific/Port_Moresby' },
    { name: 'Samoa', timezone: 'Pacific/Apia' },
    { name: 'Solomon Islands', timezone: 'Pacific/Guadalcanal' },
    { name: 'Tonga', timezone: 'Pacific/Tongatapu' },
    { name: 'Tuvalu', timezone: 'Pacific/Funafuti' },
    { name: 'Vanuatu', timezone: 'Pacific/Efate' },
    { name: 'Đảo Norfolk', timezone: 'Pacific/Norfolk' },
    { name: 'Quần đảo Solomon', timezone: 'Pacific/Guadalcanal' },
    
    // Châu Phi
    { name: 'Nam Phi (Johannesburg)', timezone: 'Africa/Johannesburg' },
    { name: 'Ai Cập (Cairo)', timezone: 'Africa/Cairo' },
    { name: 'Kenya (Nairobi)', timezone: 'Africa/Nairobi' },
    { name: 'Nigeria (Lagos)', timezone: 'Africa/Lagos' },
    { name: 'Morocco (Casablanca)', timezone: 'Africa/Casablanca' },
    { name: 'Algeria', timezone: 'Africa/Algiers' },
    { name: 'Angola', timezone: 'Africa/Luanda' },
    { name: 'Benin', timezone: 'Africa/Porto-Novo' },
    { name: 'Botswana', timezone: 'Africa/Gaborone' },
    { name: 'Burkina Faso', timezone: 'Africa/Ouagadougou' },
    { name: 'Burundi', timezone: 'Africa/Bujumbura' },
    { name: 'Cameroon', timezone: 'Africa/Douala' },
    { name: 'Cape Verde', timezone: 'Atlantic/Cape_Verde' },
    { name: 'Central African Republic', timezone: 'Africa/Bangui' },
    { name: 'Các Tiểu Vương quốc Ả Rập Thống nhất', timezone: 'Asia/Dubai' },
    { name: 'Chad', timezone: 'Africa/Ndjamena' },
    { name: 'Comoros', timezone: 'Indian/Comoro' },
    { name: 'Congo', timezone: 'Africa/Brazzaville' },
    { name: 'Congo (Kinshasa)', timezone: 'Africa/Kinshasa' },
    { name: 'Djibouti', timezone: 'Africa/Djibouti' },
    { name: 'Equatorial Guinea', timezone: 'Africa/Malabo' },
    { name: 'Eritrea', timezone: 'Africa/Asmara' },
    { name: 'Eswatini', timezone: 'Africa/Mbabane' },
    { name: 'Ethiopia', timezone: 'Africa/Addis_Ababa' },
    { name: 'Gabon', timezone: 'Africa/Libreville' },
    { name: 'Gambia', timezone: 'Africa/Banjul' },
    { name: 'Ghana', timezone: 'Africa/Accra' },
    { name: 'Guinea', timezone: 'Africa/Conakry' },
    { name: 'Guinea-Bissau', timezone: 'Africa/Bissau' },
    { name: 'Ivory Coast', timezone: 'Africa/Abidjan' },
    { name: 'Lesotho', timezone: 'Africa/Maseru' },
    { name: 'Liberia', timezone: 'Africa/Monrovia' },
    { name: 'Libya', timezone: 'Africa/Tripoli' },
    { name: 'Madagascar', timezone: 'Indian/Antananarivo' },
    { name: 'Malawi', timezone: 'Africa/Blantyre' },
    { name: 'Mali', timezone: 'Africa/Bamako' },
    { name: 'Mauritania', timezone: 'Africa/Nouakchott' },
    { name: 'Mauritius', timezone: 'Indian/Mauritius' },
    { name: 'Mozambique', timezone: 'Africa/Maputo' },
    { name: 'Namibia', timezone: 'Africa/Windhoek' },
    { name: 'Niger', timezone: 'Africa/Niamey' },
    { name: 'Rwanda', timezone: 'Africa/Kigali' },
    { name: 'Sao Tome and Principe', timezone: 'Africa/Sao_Tome' },
    { name: 'Senegal', timezone: 'Africa/Dakar' },
    { name: 'Seychelles', timezone: 'Indian/Mahe' },
    { name: 'Sierra Leone', timezone: 'Africa/Freetown' },
    { name: 'Somalia', timezone: 'Africa/Mogadishu' },
    { name: 'South Sudan', timezone: 'Africa/Juba' },
    { name: 'Sudan', timezone: 'Africa/Khartoum' },
    { name: 'Tanzania', timezone: 'Africa/Dar_es_Salaam' },
    { name: 'Togo', timezone: 'Africa/Lome' },
    { name: 'Tunisia', timezone: 'Africa/Tunis' },
    { name: 'Uganda', timezone: 'Africa/Kampala' },
    { name: 'Zambia', timezone: 'Africa/Lusaka' },
    { name: 'Zimbabwe', timezone: 'Africa/Harare' },
    
    // Các tên địa danh tiếng Việt
    { name: 'Ả Rập Xê-út', timezone: 'Asia/Riyadh' },
    { name: 'Ai Cập', timezone: 'Africa/Cairo' },
    { name: 'Ba Lan', timezone: 'Europe/Warsaw' },
    { name: 'Bồ Đào Nha', timezone: 'Europe/Lisbon' },
    { name: 'Campuchia', timezone: 'Asia/Phnom_Penh' },
    { name: 'Cộng hòa Trung Phi', timezone: 'Africa/Bangui' },
    { name: 'Đài Loan', timezone: 'Asia/Taipei' },
    { name: 'Đan Mạch', timezone: 'Europe/Copenhagen' },
    { name: 'Đảo Man', timezone: 'Europe/Isle_of_Man' },
    { name: 'Đảo Giáng Sinh', timezone: 'Indian/Christmas' },
    { name: 'Đức', timezone: 'Europe/Berlin' },
    { name: 'Hà Lan', timezone: 'Europe/Amsterdam' },
    { name: 'Hàn Quốc', timezone: 'Asia/Seoul' },
    { name: 'Hồng Kông', timezone: 'Asia/Hong_Kong' },
    { name: 'Hy Lạp', timezone: 'Europe/Athens' },
    { name: 'Lào', timezone: 'Asia/Vientiane' },
    { name: 'Lãnh thổ Ấn độ dương thuộc Anh', timezone: 'Indian/Chagos' },
    { name: 'Litva', timezone: 'Europe/Vilnius' },
    { name: 'Mã-rốc', timezone: 'Africa/Casablanca' },
    { name: 'Ma-cao', timezone: 'Asia/Macau' },
    { name: 'Mông Cổ', timezone: 'Asia/Ulaanbaatar' },
    { name: 'Myanmar (Miến Điện)', timezone: 'Asia/Yangon' },
    { name: 'Nam Cực', timezone: 'Antarctica/Casey' },
    { name: 'Nam Phi', timezone: 'Africa/Johannesburg' },
    { name: 'Nam Sudan', timezone: 'Africa/Juba' },
    { name: 'Na Uy', timezone: 'Europe/Oslo' },
    { name: 'Nga', timezone: 'Europe/Moscow' },
    { name: 'Nhật Bản', timezone: 'Asia/Tokyo' },
    { name: 'Pháp', timezone: 'Europe/Paris' },
    { name: 'Phần Lan', timezone: 'Europe/Helsinki' },
    { name: 'Philippines', timezone: 'Asia/Manila' }
  ];
  
  return fullTimeZonesList;
}
// Thêm hàm mới để hiển thị thời gian thực tế theo múi giờ
function updateCurrentTimeInfo(region, timezone) {
  // Kiểm tra xem phần tử đã tồn tại hay chưa
  let currentTimeInfo = document.getElementById('currentTimeInfo');
  
  // Nếu chưa tồn tại, tạo phần tử mới
  if (!currentTimeInfo) {
    currentTimeInfo = document.createElement('div');
    currentTimeInfo.id = 'currentTimeInfo';
    currentTimeInfo.style.marginTop = '10px';
    currentTimeInfo.style.color = 'blue';
    currentTimeInfo.style.fontWeight = 'bold';
    currentTimeInfo.style.textAlign = 'center';
    currentTimeInfo.style.backgroundColor = '#f0f8ff';
    currentTimeInfo.style.padding = '8px';
    currentTimeInfo.style.borderRadius = '5px';
    currentTimeInfo.style.border = '1px solid #ddd';
    
    // Chèn sau nút Lưu trong container của vùng
    const saveRegionButton = document.getElementById('saveRegionButton');
    if (saveRegionButton && saveRegionButton.parentNode) {
      saveRegionButton.parentNode.appendChild(currentTimeInfo);
    }
  }
  
  try {
    // Lấy thời gian hiện tại theo múi giờ đã chọn
    const now = new Date();
    const options = {
      timeZone: timezone,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    };
    
    // Format ngày giờ đầy đủ
    const formattedTime = now.toLocaleString('vi-VN', options);
    
    // Hiển thị thông tin
    currentTimeInfo.innerHTML = `<div>Thời gian thực tế tại ${region}:</div><div style="font-size: 16px; margin-top: 5px;">${formattedTime}</div>`;
    currentTimeInfo.style.display = 'block';
  } catch (error) {
    console.error('Lỗi khi hiển thị thời gian thực tế:', error);
    currentTimeInfo.style.display = 'none';
  }
}

// Cập nhật sự kiện nút Lưu vùng để hiển thị thời gian thực tế
saveRegionButton.addEventListener('click', async () => {
  const region = regionSelect.value;
  
  if (!region) {
    showStatus('Vui lòng chọn vùng trước', true);
    return;
  }
  
  // Lấy múi giờ từ tên vùng
  const timeZone = mapRegionToTimeZone(region);
  
  if (!timeZone) {
    showStatus('Không tìm thấy múi giờ cho vùng đã chọn', true);
    return;
  }
  
  console.log(`Đang cài đặt múi giờ ${timeZone} cho vùng ${region}`);
  
  // Bật lại chế độ cập nhật tự động và cập nhật thời gian theo múi giờ mới
  autoTimeUpdate = true;
  updateTimeByTimeZone(timeZone);
  
  // Hiển thị thông tin thời gian thực tế của vùng
  updateCurrentTimeInfo(region, timeZone);
  
  // Xây dựng lệnh để cài đặt múi giờ
  const command = `adb -s \${deviceId} shell "su -c 'settings put global auto_time_zone 0; settings put system auto_time_zone 0; settings put system time_zone \\"${timeZone}\\"; setprop persist.sys.timezone \\"${timeZone}\\"'" || adb -s \${deviceId} shell "settings put global auto_time_zone 0; settings put system auto_time_zone 0; settings put system time_zone \\"${timeZone}\\""`;
  
  await executeOnSelectedDevices(
    command,
    `Đã cài đặt múi giờ thành: ${region} (${timeZone})`,
    'Lỗi khi lưu cài đặt múi giờ'
  );
});
// Hàm ánh xạ tên vùng sang múi giờ
function mapRegionToTimeZone(region) {
  // Tìm múi giờ tương ứng với tên vùng
  const found = timeZonesList.find(item => item.name === region || item.timezone === region);
  if (found) {
    return found.timezone;
  }
  
  // Nếu không tìm thấy, trả về chính tên vùng đó (có thể là một múi giờ)
  return region;
}

// Hàm cập nhật giá trị thời gian hiện tại
function updateCurrentTime() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  
  dateInput.value = `${day}/${month}/${year}`;
  timeInput.value = `${hours}:${minutes}`;
}

// Hàm cập nhật thời gian theo múi giờ đã chọn
function updateTimeByTimeZone(timezone) {
  // Nếu chế độ cập nhật tự động bị tắt, không thực hiện cập nhật
  if (!autoTimeUpdate) return;
  
  try {
    // Kiểm tra nếu timezone là null hoặc undefined
    if (!timezone) {
      console.error('Timezone không hợp lệ:', timezone);
      return;
    }
    
    console.log('Đang cập nhật thời gian theo timezone:', timezone);
    
    // Tạo đối tượng Date với thời gian hiện tại
    const now = new Date();
    
    // Lấy thời gian theo múi giờ đã chọn dưới dạng chuỗi
    const timeString = now.toLocaleString('vi-VN', {
      timeZone: timezone,
      hour12: false
    });
    
    console.log('Chuỗi thời gian theo múi giờ:', timeString);
    
    // Phân tích chuỗi thời gian để lấy giá trị ngày và giờ
    // Định dạng điển hình: "DD/MM/YYYY, HH:MM:SS"
    const parts = timeString.split(', ');
    if (parts.length !== 2) {
      console.error('Định dạng thời gian không đúng:', timeString);
      return;
    }
    
    const datePart = parts[0]; // DD/MM/YYYY
    const timePart = parts[1].split(':'); // HH:MM:SS
    
    // Cập nhật giá trị ngày và giờ
    dateInput.value = datePart;
    timeInput.value = `${timePart[0]}:${timePart[1]}`;
    
    console.log(`Đã cập nhật thời gian theo múi giờ ${timezone}: ${dateInput.value} ${timeInput.value}`);
  } catch (error) {
    console.error('Lỗi khi cập nhật thời gian theo múi giờ:', error);
    // Sử dụng thời gian hiện tại của hệ thống nếu có lỗi
    updateCurrentTime();
  }
}

// Khởi tạo danh sách múi giờ
async function initializeTimeZones() {
  timeZonesList = await getTimeZones();
  
  // Thêm vào datalist
  regionList.innerHTML = '';
  
  // Sắp xếp danh sách theo tên vùng
  timeZonesList.sort((a, b) => a.name.localeCompare(b.name));
  
  // Thêm các vùng vào datalist
  timeZonesList.forEach(item => {
    const option = document.createElement('option');
    option.value = item.name;
    regionList.appendChild(option);
  });
  
  // Xóa sự kiện cũ (nếu có) để tránh đăng ký nhiều lần
  regionSelect.removeEventListener('change', handleRegionChange);
  regionSelect.removeEventListener('input', handleRegionChange);
  
  // Thêm sự kiện cho input regionSelect
  regionSelect.addEventListener('change', handleRegionChange);
  regionSelect.addEventListener('input', handleRegionChange);
  
  // Khởi tạo với giá trị ban đầu
  handleRegionChange();
  
  // Thêm sự kiện cho date và time input để tắt cập nhật tự động khi người dùng thay đổi
  dateInput.addEventListener('focus', () => {
    autoTimeUpdate = false;
  });
  
  timeInput.addEventListener('focus', () => {
    autoTimeUpdate = false;
  });
}

// Hàm xử lý khi thay đổi vùng
function handleRegionChange() {
  // Bật lại chế độ cập nhật tự động khi chọn vùng
  autoTimeUpdate = true;
  
  const selectedRegion = regionSelect.value;
  console.log('Đã chọn vùng:', selectedRegion);
  
  if (!selectedRegion) return;
  
  const timezone = mapRegionToTimeZone(selectedRegion);
  console.log('Tìm thấy múi giờ:', timezone);
  
  if (timezone) {
    // Cập nhật thời gian theo múi giờ đã chọn
    updateTimeByTimeZone(timezone);
  }
}

// Hàm để thực hiện lệnh ADB trên tất cả các thiết bị được chọn
async function executeOnSelectedDevices(command, successMessage, errorMessage) {
  if (selectedDevices.length === 0) {
    showStatus('Vui lòng chọn ít nhất một thiết bị trước', true);
    return false;
  }
  
  showStatus(`Đang thực hiện lệnh trên ${selectedDevices.length} thiết bị...`);
  
  const results = [];
  
  for (const deviceId of selectedDevices) {
    try {
      // Thay thế biến ${deviceId} trong chuỗi command bằng giá trị thực
      const deviceCommand = command.replaceAll('${deviceId}', deviceId);
      console.log(`Thực thi lệnh trên thiết bị ${deviceId}:`, deviceCommand);
      
      const result = await execPromise(deviceCommand);
      console.log(`Kết quả từ thiết bị ${deviceId}:`, result);
      
      results.push({ deviceId, success: true });
    } catch (error) {
      console.error(`Lỗi trên thiết bị ${deviceId}:`, error);
      results.push({ deviceId, success: false, error: error.message });
    }
  }
  
  // Kiểm tra kết quả
  const allSucceeded = results.every(result => result.success);
  const someSucceeded = results.some(result => result.success);
  
  if (allSucceeded) {
    showStatus(`${successMessage} trên tất cả ${selectedDevices.length} thiết bị!`);
    return true;
  } else if (someSucceeded) {
    const successDevices = results.filter(r => r.success).map(r => r.deviceId).join(', ');
    const failDevices = results.filter(r => !r.success).map(r => r.deviceId).join(', ');
    showStatus(`${successMessage} trên thiết bị: ${successDevices}. Thất bại trên: ${failDevices}`, true);
    return someSucceeded;
  } else {
    showStatus(`${errorMessage} trên tất cả các thiết bị.`, true);
    return false;
  }
}

// 1. Nút Home - Để trở về home trên phone
homeButton.addEventListener('click', async () => {
  await executeOnSelectedDevices(
    `adb -s \${deviceId} shell input keyevent KEYCODE_HOME`,
    'Đã trở về màn hình Home thành công',
    'Lỗi khi thực hiện lệnh Home'
  );
});

// 2. Nút Bật 4G - Bật kết nối dữ liệu di động
enable4gButton.addEventListener('click', async () => {
  await executeOnSelectedDevices(
    `adb -s \${deviceId} shell "su -c 'svc data enable'" || adb -s \${deviceId} shell svc data enable`,
    'Đã bật 4G thành công',
    'Lỗi khi bật 4G'
  );
});

// 3. Nút Tắt 4G - Tắt kết nối dữ liệu di động
disable4gButton.addEventListener('click', async () => {
  await executeOnSelectedDevices(
    `adb -s \${deviceId} shell "su -c 'svc data disable'" || adb -s \${deviceId} shell svc data disable`,
    'Đã tắt 4G thành công',
    'Lỗi khi tắt 4G'
  );
});

// 4. Nút Bật múi giờ tự động - Bật múi giờ tự động trên thiết bị
enableTimeButton.addEventListener('click', async () => {
  const success = await executeOnSelectedDevices(
    `adb -s \${deviceId} shell "su -c 'settings put global auto_time 1; settings put global auto_time_zone 1; settings put system auto_time 1; settings put system auto_time_zone 1'" || adb -s \${deviceId} shell "settings put global auto_time 1; settings put global auto_time_zone 1; settings put system auto_time 1; settings put system auto_time_zone 1"`,
    'Đã bật múi giờ tự động thành công',
    'Lỗi khi bật múi giờ tự động'
  );
  
  if (success) {
    // Cập nhật thời gian hiện tại vào form
    updateCurrentTime();
  }
});

// 5. Nút Lưu vùng - Lưu cài đặt múi giờ
saveRegionButton.addEventListener('click', async () => {
  const region = regionSelect.value;
  
  if (!region) {
    showStatus('Vui lòng chọn vùng trước', true);
    return;
  }
  
  // Lấy múi giờ từ tên vùng
  const timeZone = mapRegionToTimeZone(region);
  
  if (!timeZone) {
    showStatus('Không tìm thấy múi giờ cho vùng đã chọn', true);
    return;
  }
  
  console.log(`Đang cài đặt múi giờ ${timeZone} cho vùng ${region}`);
  
  // Bật lại chế độ cập nhật tự động và cập nhật thời gian theo múi giờ mới
  autoTimeUpdate = true;
  updateTimeByTimeZone(timeZone);
  
  // Xây dựng lệnh để cài đặt múi giờ
  const command = `adb -s \${deviceId} shell "su -c 'settings put global auto_time_zone 0; settings put system auto_time_zone 0; settings put system time_zone \\"${timeZone}\\"; setprop persist.sys.timezone \\"${timeZone}\\"'" || adb -s \${deviceId} shell "settings put global auto_time_zone 0; settings put system auto_time_zone 0; settings put system time_zone \\"${timeZone}\\""`;
  
  await executeOnSelectedDevices(
    command,
    `Đã cài đặt múi giờ thành: ${region} (${timeZone})`,
    'Lỗi khi lưu cài đặt múi giờ'
  );
});

// 6. Nút Lưu thời gian - Lưu cài đặt thời gian tùy chỉnh
saveTimeButton.addEventListener('click', async () => {
  const date = dateInput.value;
  const time = timeInput.value;
  
  // Kiểm tra định dạng ngày và giờ
  const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const timeRegex = /^(\d{2}):(\d{2})$/;
  
  if (!dateRegex.test(date)) {
    showStatus('Định dạng ngày không đúng. Sử dụng DD/MM/YYYY', true);
    return;
  }
  
  if (!timeRegex.test(time)) {
    showStatus('Định dạng giờ không đúng. Sử dụng HH:MM', true);
    return;
  }
  
  // Phân tích giá trị
  const dateMatch = date.match(dateRegex);
  const day = dateMatch[1];
  const month = dateMatch[2];
  const year = dateMatch[3];
  
  const timeMatch = time.match(timeRegex);
  const hour = timeMatch[1];
  const minute = timeMatch[2];
  
  // Xây dựng lệnh để cài đặt thời gian
  const command = `adb -s \${deviceId} shell "su -c 'settings put global auto_time 0; settings put system auto_time 0; date ${month}${day}${hour}${minute}${year}.00'" || adb -s \${deviceId} shell "settings put global auto_time 0; settings put system auto_time 0; date -s \\"${year}-${month}-${day} ${hour}:${minute}:00\\""`;
  
  await executeOnSelectedDevices(
    command,
    `Đã cài đặt thời gian thành: ${date} ${time}`,
    'Lỗi khi lưu cài đặt thời gian'
  );
  
  // Tắt cập nhật tự động sau khi người dùng đã lưu thời gian tùy chỉnh
  autoTimeUpdate = false;
});

// 7. Nút Chạy/Dừng chạy - Bật/tắt chức năng thay đổi DPI
dpiButton.addEventListener('click', () => {
  if (!isDpiRunning) {
    // Bắt đầu vòng lặp DPI
    startDpiCycle();
    dpiButton.textContent = 'Dừng chạy';
    isDpiRunning = true;
  } else {
    // Dừng vòng lặp DPI
    stopDpiCycle();
    dpiButton.textContent = 'Chạy';
    isDpiRunning = false;
    showStatus('Đã dừng thay đổi DPI');
  }
});

// Hàm bắt đầu vòng lặp DPI
async function startDpiCycle() {
  if (selectedDevices.length === 0) {
    showStatus('Vui lòng chọn ít nhất một thiết bị trước', true);
    dpiButton.textContent = 'Chạy';
    isDpiRunning = false;
    return;
  }
  
  showStatus('Đang bắt đầu thay đổi DPI...');
  
  // Lấy giá trị DPI
  let dpi1 = parseInt(dpiInput1.value) || 320;
  let dpi2 = parseInt(dpiInput2.value) || 480;
  
  // Lấy thời gian vòng lặp từ input, với giá trị mặc định là 5000ms
  // Đảm bảo thời gian tối thiểu là 500ms để tránh thay đổi quá nhanh
  let loopTime = parseInt(loopTimeInput.value) || 5000;
  loopTime = Math.max(500, loopTime); // Đảm bảo tối thiểu 500ms
  
  // Cập nhật giá trị trong input
  loopTimeInput.value = loopTime;
  
  let useFirstDpi = true;
  
  // Bắt đầu vòng lặp
  dpiIntervalId = setInterval(async () => {
    try {
      const currentDpi = useFirstDpi ? dpi1 : dpi2;
      showStatus(`Đang thay đổi DPI thành ${currentDpi}...`);
      
      // Thực hiện thay đổi DPI trên tất cả thiết bị được chọn
      const results = [];
      for (const deviceId of selectedDevices) {
        try {
          // Thử thiết lập DPI bằng lệnh wm với quyền root hoặc thông thường
          const command = `adb -s ${deviceId} shell "su -c 'wm density ${currentDpi}'" || adb -s ${deviceId} shell wm density ${currentDpi}`;
          await execPromise(command);
          results.push({ deviceId, success: true });
        } catch (error) {
          console.error(`Lỗi khi thiết lập DPI trên thiết bị ${deviceId}:`, error);
          results.push({ deviceId, success: false });
        }
      }
      
      // Kiểm tra kết quả
      const allSucceeded = results.every(result => result.success);
      const someSucceeded = results.some(result => result.success);
      
      if (allSucceeded) {
        showStatus(`Đã thay đổi DPI thành ${currentDpi} trên tất cả thiết bị`);
      } else if (someSucceeded) {
        const successDevices = results.filter(r => r.success).map(r => r.deviceId).join(', ');
        const failDevices = results.filter(r => !r.success).map(r => r.deviceId).join(', ');
        showStatus(`Đã thay đổi DPI thành ${currentDpi} trên thiết bị: ${successDevices}. Thất bại trên: ${failDevices}`);
      } else {
        showStatus(`Lỗi khi thay đổi DPI trên tất cả thiết bị.`, true);
      }
      
      useFirstDpi = !useFirstDpi;
    } catch (error) {
      console.error('Lỗi trong vòng lặp DPI:', error);
      showStatus('Lỗi khi thay đổi DPI: ' + error.message, true);
    }
  }, loopTime); // Sử dụng thời gian vòng lặp tùy chỉnh thay vì giá trị cố định 5000
}

// Hàm dừng vòng lặp DPI
function stopDpiCycle() {
  if (dpiIntervalId) {
    clearInterval(dpiIntervalId);
    dpiIntervalId = null;
  }
}
//code mới
// Khai báo biến nút Xóa tất cả và hàm xóa tất cả ứng dụng ở ngoài sự kiện DOMContentLoaded
const clearAllButton = document.getElementById('clearAllButton');

// Hàm để thực hiện xóa tất cả ứng dụng
async function clearAllApps() {
  if (selectedDevices.length === 0) {
    showStatus('Vui lòng chọn ít nhất một thiết bị trước', true);
    return;
  }
  
  showStatus(`Đang xóa tất cả ứng dụng đang chạy trên ${selectedDevices.length} thiết bị...`);
  
  try {
    // Tạo mảng các promises để thực hiện đồng thời trên tất cả thiết bị
    const promises = selectedDevices.map(async (deviceId) => {
      try {
        // Bước 1: Mở chế độ đa nhiệm (recent apps)
        await execPromise(`adb -s ${deviceId} shell input keyevent KEYCODE_APP_SWITCH`);
        // Chờ cho giao diện đa nhiệm hiện lên (tăng thời gian chờ)
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Bước 2: Vuốt sang phải 5 lần
        // Lấy kích thước màn hình để tính toán tọa độ vuốt
        const { stdout: sizeInfo } = await execPromise(`adb -s ${deviceId} shell wm size`);
        console.log(`[${deviceId}] Kích thước màn hình: ${sizeInfo}`);
        
        // Phân tích thông tin kích thước màn hình
        let width = 1080; // Giá trị mặc định
        let height = 1920; // Giá trị mặc định
        
        const sizeMatch = sizeInfo.match(/(\d+)x(\d+)/);
        if (sizeMatch && sizeMatch.length >= 3) {
          width = parseInt(sizeMatch[1]);
          height = parseInt(sizeMatch[2]);
        }
        
        console.log(`[${deviceId}] Kích thước đã phân tích: ${width}x${height}`);
        
        // Tính toán tọa độ cho thao tác vuốt
        const startX = Math.floor(width * 0.8); // 80% chiều rộng từ bên trái
        const endX = Math.floor(width * 0.2);   // 20% chiều rộng từ bên trái
        const y = Math.floor(height * 0.5);     // Giữa màn hình theo chiều cao
        
        // Thực hiện 5 lần vuốt sang phải
        for (let i = 0; i < 5; i++) {
          console.log(`[${deviceId}] Vuốt lần ${i+1}: từ (${endX},${y}) đến (${startX},${y})`);
          await execPromise(`adb -s ${deviceId} shell input swipe ${endX} ${y} ${startX} ${y} 300`);
          // Chờ giữa các lần vuốt
          await new Promise(resolve => setTimeout(resolve, 700));
        }
        
        // Chờ thêm sau khi vuốt để giao diện ổn định
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Bước 3: Thử nhiều vị trí khác nhau để tìm và nhấn nút "Xóa tất cả"
// Dựa trên hình ảnh đã cung cấp, nút "Xóa tất cả" nằm ở bên trái, giữa màn hình
const positions = [
  // Vị trí chính xác theo hình ảnh - bên trái, giữa màn hình
  { x: Math.floor(width * 0.2), y: Math.floor(height * 0.45) },  // ~20% từ trái, ~45% từ trên xuống
  
  // Các vị trí xung quanh để tăng khả năng trúng
  { x: Math.floor(width * 0.15), y: Math.floor(height * 0.45) }, // Hơi lệch trái
  { x: Math.floor(width * 0.25), y: Math.floor(height * 0.45) }, // Hơi lệch phải
  { x: Math.floor(width * 0.2), y: Math.floor(height * 0.4) },   // Hơi lệch lên
  { x: Math.floor(width * 0.2), y: Math.floor(height * 0.5) },   // Hơi lệch xuống
  
  // Các vị trí thêm cho các trường hợp khác
  { x: Math.floor(width * 0.15), y: Math.floor(height * 0.4) },  // Lệch trái lên
  { x: Math.floor(width * 0.15), y: Math.floor(height * 0.5) },  // Lệch trái xuống
  { x: Math.floor(width * 0.25), y: Math.floor(height * 0.4) },  // Lệch phải lên
  { x: Math.floor(width * 0.25), y: Math.floor(height * 0.5) },  // Lệch phải xuống
  
  // Nút "Xóa tất cả" có thể nằm bên phải ở một số thiết bị, thử thêm
  { x: Math.floor(width * 0.8), y: Math.floor(height * 0.45) }   // Bên phải, giữa màn hình
];
        
        // In thông tin vị trí sẽ thử
        console.log(`[${deviceId}] Sẽ thử các vị trí tap: ${JSON.stringify(positions)}`);
        
        // Thử tap vào từng vị trí một
        for (const pos of positions) {
          console.log(`[${deviceId}] Thử tap vào vị trí (${pos.x},${pos.y})`);
          await execPromise(`adb -s ${deviceId} shell input tap ${pos.x} ${pos.y}`);
          // Chờ một chút giữa các lần tap
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        // Chờ một chút để hoàn thành thao tác
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return { deviceId, success: true };
      } catch (error) {
        console.error(`[${deviceId}] Lỗi khi xóa tất cả ứng dụng:`, error);
        return { deviceId, success: false, error: error.message };
      }
    });
    
    // Chờ tất cả các thiết bị hoàn thành đồng thời
    const results = await Promise.all(promises);
    
    // Kiểm tra kết quả
    const allSucceeded = results.every(result => result.success);
    const someSucceeded = results.some(result => result.success);
    
    if (allSucceeded) {
      showStatus(`Đã xóa tất cả ứng dụng trên ${selectedDevices.length} thiết bị!`);
    } else if (someSucceeded) {
      const successDevices = results.filter(r => r.success).map(r => r.deviceId).join(', ');
      const failDevices = results.filter(r => !r.success).map(r => r.deviceId).join(', ');
      showStatus(`Đã xóa tất cả ứng dụng trên thiết bị: ${successDevices}. Thất bại trên: ${failDevices}`, true);
    } else {
      showStatus(`Lỗi khi xóa tất cả ứng dụng trên tất cả các thiết bị.`, true);
    }
  } catch (error) {
    console.error('Lỗi khi xóa tất cả ứng dụng:', error);
    showStatus('Lỗi khi xóa tất cả ứng dụng: ' + error.message, true);
  }
}

// Khởi tạo khi trang được load
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Tạo container cho danh sách thiết bị nếu chưa có
    if (!deviceList) {
      // Tạo container cho danh sách thiết bị
      const deviceListContainer = document.createElement('div');
      deviceListContainer.id = 'deviceList';
      deviceListContainer.style.width = '100%';
      deviceListContainer.style.maxHeight = '200px';
      deviceListContainer.style.overflowY = 'auto';
      deviceListContainer.style.marginTop = '10px';
      
      // Chèn vào sau device selector
      if (deviceSelector && deviceSelector.parentNode) {
        deviceSelector.parentNode.appendChild(deviceListContainer);
      }
    }
    
    // Thêm sự kiện cho nút làm mới danh sách thiết bị
    if (refreshAllDevicesButton) {
      refreshAllDevicesButton.addEventListener('click', async () => {
        await updateDeviceList();
      });
    }
    
    // Thêm sự kiện khi thay đổi thiết bị (phiên bản cũ)
    if (deviceSelector) {
      deviceSelector.addEventListener('change', function() {
        const selectedDevice = this.value;
        selectedDevices = [selectedDevice]; // Cập nhật danh sách thiết bị được chọn
        
        // Cập nhật trạng thái
        showStatus(`Đã chọn thiết bị: ${selectedDevice}`);
        
        // Cập nhật thông tin thiết bị được chọn hiển thị
        updateSelectedDevicesInfo();
      });
    }
    
    // Thêm sự kiện click cho nút Xóa tất cả
    if (clearAllButton) {
      clearAllButton.addEventListener('click', async () => {
        await clearAllApps();
      });
    } else {
      console.error('Không tìm thấy nút Xóa tất cả. Hãy kiểm tra HTML của bạn.');
    }
    
    // Cập nhật danh sách thiết bị
    await updateDeviceList();
    
    // Khởi tạo danh sách múi giờ
    await initializeTimeZones();
    
    // Cập nhật thời gian hiện tại
    updateCurrentTime();
  } catch (error) {
    console.error('Lỗi khi khởi tạo ứng dụng:', error);
    showStatus('Lỗi khi khởi tạo ứng dụng: ' + error.message, true);
  }
});