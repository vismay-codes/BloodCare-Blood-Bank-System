const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
const api=async(path,opt={})=>{const r=await fetch('/api'+path,{headers:{'Content-Type':'application/json'},...opt});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Request failed');return d};
function showView(id){$$('.view').forEach(x=>x.classList.remove('active'));$('#'+id).classList.add('active');$$('.nav').forEach(x=>x.classList.toggle('active',x.dataset.view===id));({dashboard:loadDashboard,donors:()=>loadDonors(1),requests:loadRequests,stock:loadStock,analytics:loadAnalytics,nearby:initNearby,about:()=>{}}[id]||loadDashboard)();window.scrollTo({top:0,behavior:'smooth'})}
$$('.nav').forEach(b=>b.onclick=()=>showView(b.dataset.view));
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
function toast(msg){$('#toast').textContent=msg;$('#toast').classList.add('show');setTimeout(()=>$('#toast').classList.remove('show'),2600)}
function fmtDate(x){return x?new Date(x).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}):'Never'}
function urgency(u){return `<span class="pill ${u==='CRITICAL'?'danger':u==='URGENT'?'':'ok'}">${esc(u)}</span>`}
async function loadDashboard(){
 try{
  const [s,q,e]=await Promise.all([
   api('/dashboard'),
   api('/requests/queue'),
   api('/stock/expiring?days=3')
  ]);

  const fulfilmentRate = Number(s.fulfilmentRate || 0).toFixed(1);

  $('#stats').innerHTML=[
   ['Registered network',s.totalDonors,'Registered donors'],
   ['Available donors',s.availableDonors,'Currently contactable'],
   ['Blood stock',s.totalStockUnits,'Available inventory'],
   ['Fulfilment rate',fulfilmentRate+'%','Across active records'],
   ['Active requests',s.activeRequests,'Awaiting fulfilment'],
   ['Critical requests',s.criticalRequests,'Highest priority'],
   ['Expiring units',s.expiringUnits,'Within 3 days'],
   ['Wasted units',s.wastedUnits,'Recorded expired stock']
  ].map(a=>`<div class="stat"><div class="label">${a[0]}</div><div class="value">${a[1]}</div><div class="hint">${a[2]}</div></div>`).join('');

  $('#queuePreview').innerHTML=q.slice(0,5).map(r=>`<div class="queue-item"><i class="priority ${r.urgency==='CRITICAL'?'critical':''}"></i><div class="queue-main"><b>${esc(r.patientName)} - ${esc(r.bloodGroup)}</b><small>${esc(r.city)} - ${r.unitsNeeded} unit(s)</small></div>${urgency(r.urgency)}</div>`).join('')||'<div class="empty">No pending requests</div>';

  $('#expiryPreview').innerHTML=e.slice(0,5).map(x=>`<div class="expiry-row"><div><b>${esc(x.bloodGroup)} - ${x.quantity} unit(s)</b><small>${esc(x.hospitalName)}</small></div><span class="pill danger">${fmtDate(x.expiryDate)}</span></div>`).join('')||'<div class="empty">No units expiring soon.</div>';
 }catch(e){toast(e.message)}
}
async function loadDonors(page=1){
 try{
  const g=encodeURIComponent($('#donorGroup').value),c=encodeURIComponent($('#donorCity').value);
  const d=await api(`/donors?bloodGroup=${g}&city=${c}&page=${page}&size=8`);
  $('#donorTable').innerHTML=d.items.length?`<table class="table"><thead><tr><th>Donor</th><th>Group</th><th>City</th><th>Last donation</th><th>Status</th><th></th></tr></thead><tbody>${d.items.map(x=>`<tr><td><b>${esc(x.fullName)}</b><br><small>${esc(x.phone)}</small></td><td class="group">${esc(x.bloodGroup)}</td><td>${esc(x.city)}</td><td>${fmtDate(x.lastDonationDate)}</td><td class="${x.available?'available':'unavailable'}">${x.available?'Available':'Unavailable'}</td><td><button class="action" onclick="recordDonation(${x.id})">Record donation</button></td></tr>`).join('')}</tbody></table>`:'<div class="empty">No donors found.</div>';
  $('#donorPager').innerHTML=Array.from({length:d.pages},(_,i)=>`<button onclick="loadDonors(${i+1})">${i+1}</button>`).join('');
 }catch(e){toast(e.message)}
}

async function recordDonation(id){
 if(!confirm('Record a donation today? The donor will be marked unavailable.'))return;
 try{
  await api(`/donors/${id}/donate`,{method:'POST'});
  toast('Donation recorded');
  loadDonors(1);
 }catch(e){toast(e.message)}
}

async function loadRequests(){
 try{
  const q=await api('/requests/queue');
  $('#requestTable').innerHTML=q.length?`<table class="table"><thead><tr><th>Priority</th><th>Patient</th><th>Need</th><th>Hospital</th><th>Status</th><th></th></tr></thead><tbody>${q.map(r=>`<tr><td>${urgency(r.urgency)}</td><td><b>${esc(r.patientName)}</b><br><small>${esc(r.city)}</small></td><td class="group">${r.bloodGroup} x ${r.unitsNeeded}</td><td>${esc(r.hospitalName)}</td><td>${esc(r.status)}</td><td><button class="action" onclick="fulfil(${r.id})">Fulfil</button></td></tr>`).join('')}</tbody></table>`:'<div class="empty">Queue is clear.</div>';
 }catch(e){toast(e.message)}
}

async function fulfil(id){
 try{
  const r=await api(`/requests/${id}/fulfil`,{method:'POST'});
  showMatches(r);
  await loadRequests();
  await loadDashboard();
  toast('Request fulfilment updated');
 }catch(e){toast(e.message)}
}
function showMatches(items){openModal(`<span class="eyebrow">FULFILMENT RESULT</span><h2>Matching completed</h2>${items.map(x=>`<div class="queue-item"><div class="queue-main"><b>${esc(x.source)}  -  ${esc(x.sourceName)}</b><small>${esc(x.message)}</small></div><span class="group">${x.bloodGroup} x ${x.units}</span></div>`).join('')||'<p class="empty">No compatible stock or eligible donor found.</p>'}`)}
async function loadStock(){
 try{const [s,e]=await Promise.all([api('/stock/summary'),api('/stock/expiring?days=3')]);
 const groups=['O-','O+','A-','A+','B-','B+','AB-','AB+'];const map=Object.fromEntries(s.map(x=>[x.bloodGroup,x.units]));
 $('#stockGrid').innerHTML=groups.map(g=>`<div class="blood-card"><div class="group">${g}</div><b>${map[g]||0}</b><small>units</small></div>`).join('');
 $('#expiryTable').innerHTML=e.length?`<table class="table"><thead><tr><th>Group</th><th>Units</th><th>Hospital</th><th>Expiry</th><th>Action</th></tr></thead><tbody>${e.map(x=>`<tr><td class="group">${x.bloodGroup}</td><td>${x.quantity}</td><td>${esc(x.hospitalName)}</td><td>${fmtDate(x.expiryDate)}</td><td><button class="action" onclick="issue(${x.id},1)">Issue 1</button></td></tr>`).join('')}</tbody></table>`:'<div class="empty">No units in the 3-day expiry window.</div>';
 }catch(e){toast(e.message)}
}
async function issue(id,q){try{const r=await api(`/stock/${id}/issue?quantity=${q}`,{method:'POST'});toast(r.success?'Unit issued':'Unable to issue unit');loadStock();loadDashboard()}catch(e){toast(e.message)}}
async function loadAnalytics(){
 try{const a=await api('/analytics');const max=Math.max(1,...a.requestsByGroup.map(x=>x.requests));const max2=Math.max(1,...a.topCities.map(x=>x.donors));const max3=Math.max(1,...a.wasteByGroup.map(x=>x.wastedUnits));
 const totalRequests = a.requestsByGroup.reduce((sum, x) => sum + Number(x.requests || 0), 0);
 const fulfilledRequests = a.fulfilment.filter(x => x.status === 'FULFILLED').reduce((sum, x) => sum + Number(x.total || 0), 0);
 const leadingCity = [...a.topCities].sort((x, y) => Number(y.donors) - Number(x.donors))[0];
 const expiredUnits = a.wasteByGroup.reduce((sum, x) => sum + Number(x.wastedUnits || 0), 0);

  document.querySelector('#analyticsSummary').innerHTML = [
   ['Total Requests', totalRequests, 'Requests across all blood groups'],
   ['Fulfilled Requests', fulfilledRequests, 'Successfully fulfilled'],
   ['Leading Donor City', leadingCity ? esc(leadingCity.city) : 'N/A', leadingCity ? leadingCity.donors + ' registered donors' : 'No city data'],
   ['Expired Units', expiredUnits, 'Recorded wastage']
  ].map(item => '<div class="stat"><div class="label">' + item[0] + '</div><div class="value">' + item[1] + '</div><div class="hint">' + item[2] + '</div></div>').join('');

 $('#analyticsGrid').innerHTML=`
 <div class="chart-card"><span class="eyebrow">REQUESTS</span><h2>By blood group</h2>${a.requestsByGroup.map(x=>`<div class="bar"><label>${x.bloodGroup}</label><i style="width:${x.requests/max*75}%"></i><span>${x.requests}</span></div>`).join('')}</div>
 <div class="chart-card"><span class="eyebrow">FULFILMENT</span><h2>Request status</h2>${a.fulfilment.map(x=>`<div class="bar"><label>${x.status}</label><i style="width:${x.total/Math.max(1,...a.fulfilment.map(y=>y.total))*75}%"></i><span>${x.total}</span></div>`).join('')}</div>
 <div class="chart-card"><span class="eyebrow">DONOR NETWORK</span><h2>Top cities</h2>${a.topCities.map(x=>`<div class="bar"><label>${esc(x.city)}</label><i style="width:${x.donors/max2*75}%"></i><span>${x.donors}</span></div>`).join('')}</div>
 <div class="chart-card"><span class="eyebrow">WASTE CONTROL</span><h2>Expired units</h2>${a.wasteByGroup.map(x=>`<div class="bar"><label>${x.bloodGroup}</label><i style="width:${x.wastedUnits/max3*75}%"></i><span>${x.wastedUnits}</span></div>`).join('')||'<div class="empty">No expired stock.</div>'}</div>`;
 }catch(e){toast(e.message)}
}
function openModal(html){$('#modalContent').innerHTML=html;$('#modal').classList.add('show')}
function closeModal(){$('#modal').classList.remove('show')}
$('#modal').onclick=e=>{if(e.target.id==='modal')closeModal()}
function openDonor(){openModal(`<span class="eyebrow">DONOR NETWORK</span><h2>Register a donor</h2><form onsubmit="saveDonor(event)"><div class="form-grid">
<label>Full name<input id="fName" required/></label><label>Blood group<select id="fGroup"><option>O-</option><option>O+</option><option>A-</option><option>A+</option><option>B-</option><option>B+</option><option>AB-</option><option>AB+</option></select></label>
<label>City<input id="fCity" required value="Nagpur"/></label><label>Phone<input id="fPhone" required/></label><label>Last donation date<input id="fLast" type="date"/></label><label>Available<select id="fAvail"><option value="true">Yes</option><option value="false">No</option></select></label>
<div class="full"><button class="primary">Save donor</button></div></div></form>`)}
async function saveDonor(e){e.preventDefault();try{await api('/donors',{method:'POST',body:JSON.stringify({fullName:$('#fName').value,bloodGroup:$('#fGroup').value,city:$('#fCity').value,phone:$('#fPhone').value,lastDonationDate:$('#fLast').value||null,available:$('#fAvail').value==='true'})});closeModal();toast('Donor registered');loadDonors(1)}catch(x){toast(x.message)}}
function openRequest(){openModal(`<span class="eyebrow">EMERGENCY DESK</span><h2>Create blood request</h2><form onsubmit="saveRequest(event)"><div class="form-grid">
<label>Patient name<input id="rName" required/></label><label>Blood group<select id="rGroup"><option>O-</option><option>O+</option><option>A-</option><option>A+</option><option>B-</option><option>B+</option><option>AB-</option><option>AB+</option></select></label>
<label>Units needed<input id="rUnits" type="number" min="1" value="1" required/></label><label>Urgency<select id="rUrg"><option>CRITICAL</option><option>URGENT</option><option>NORMAL</option></select></label>
<label>Hospital<input id="rHospital" value="Lifeline Multispeciality Hospital" required/></label><label>City<input id="rCity" value="Nagpur" required/></label>
<div class="full"><button class="primary">Place in priority queue</button></div></div></form>`)}
async function saveRequest(e){e.preventDefault();try{await api('/requests',{method:'POST',body:JSON.stringify({patientName:$('#rName').value,bloodGroup:$('#rGroup').value,unitsNeeded:+$('#rUnits').value,urgency:$('#rUrg').value,hospitalName:$('#rHospital').value,city:$('#rCity').value})});closeModal();toast('Request placed in queue');loadRequests()}catch(x){toast(x.message)}}
function openStock(){openModal(`<span class="eyebrow">INVENTORY</span><h2>Add blood stock</h2><form onsubmit="saveStock(event)"><div class="form-grid">
<label>Blood group<select id="sGroup"><option>O-</option><option>O+</option><option>A-</option><option>A+</option><option>B-</option><option>B+</option><option>AB-</option><option>AB+</option></select></label><label>Quantity<input id="sQty" type="number" min="1" value="1" required/></label>
<label>Hospital<input id="sHospital" value="Lifeline Multispeciality Hospital" required/></label><label>City<input id="sCity" value="Nagpur" required/></label>
<label>Collection date<input id="sCollection" type="date" required/></label><label>Expiry date<input id="sExpiry" type="date" required/></label>
<div class="full"><button class="primary">Add stock</button></div></div></form>`);$('#sCollection').valueAsDate=new Date();let d=new Date();d.setDate(d.getDate()+35);$('#sExpiry').valueAsDate=d}
async function saveStock(e){e.preventDefault();try{await api('/stock',{method:'POST',body:JSON.stringify({bloodGroup:$('#sGroup').value,quantity:+$('#sQty').value,hospitalName:$('#sHospital').value,city:$('#sCity').value,collectionDate:$('#sCollection').value,expiryDate:$('#sExpiry').value,status:'AVAILABLE'})});closeModal();toast('Stock added');loadStock();loadDashboard()}catch(x){toast(x.message)}}
function toggleAssistant(){$('#assistant').classList.toggle('show')}
function chat(){const input=$('#chatInput');const q=input.value.trim();if(!q)return;$('#chat').insertAdjacentHTML('beforeend','<div class="user">'+esc(q)+'</div>');input.value='';const t=q.toLowerCase();let a;if(/(^|\b)(hi|hello|hey)\b/.test(t)){a='Hi! I am BloodCare Assistant. Ask me about donor eligibility, blood compatibility, urgent requests, stock expiry, or fulfilment.'}else if(t.includes('eligib')||t.includes('donor rule')||t.includes('donate')){a='Donor eligibility: a donor is eligible in this project when at least 90 days have passed since the last donation and the donor is available. The system checks the donation date and availability before matching a donor.'}else if(t.includes('90')){a='A donor must have at least 90 days between donations to be considered eligible in this project.'}else if(t.includes('compatible')||t.includes('compatibility')||t.includes('blood group')||t.includes('o-')||t.includes('ab+')){a='For red-cell matching, O- is the broadest donor group and AB+ can receive from all listed groups. The system uses blood-group compatibility rules before suggesting donors.'}else if(t.includes('expiry')||t.includes('expire')||t.includes('expiring')){a='The Stock Watch shows available blood units that are expiring today or within the next 3 days, helping the bank issue older stock first and reduce wastage.'}else if(t.includes('priority')||t.includes('urgent')||t.includes('critical')){a='Emergency requests are prioritized as Critical, then Urgent, then Normal using a Java PriorityQueue.'}else if(t.includes('fulfil')||t.includes('fulfill')||t.includes('request')){a='Fulfilment checks available compatible blood stock first. If stock cannot completely satisfy the request, the system can look for eligible compatible donors.'}else if(t.includes('stock')||t.includes('blood units')||t.includes('inventory')){a='The stock module tracks blood-group quantities, availability, collection dates, and expiry dates. Available units can be issued against requests.'}else{a='I can help with donor eligibility, 90-day donation rules, blood compatibility, emergency priority, stock expiry, or request fulfilment. Try asking: Explain donor eligibility.'}setTimeout(()=>{$('#chat').insertAdjacentHTML('beforeend','<div class="bot">'+a+'</div>');$('#chat').scrollTop=99999},250)}

function initNearby(){}

function useMyLocation(){
  const status=$('#locationStatus');
  const coords=$('#mapCoords');
  const map=$('#nearbyMap');
  const searchBtn=$('#mapsSearchBtn');
  const openBtn=$('#mapsOpenBtn');
  const button=$('#useLocationBtn');

  if(!navigator.geolocation){
    status.textContent='Geolocation is not supported by this browser.';
    return;
  }

  button.disabled=true;
  button.textContent='Detecting location...';
  status.textContent='Requesting your location. Please allow location access in the browser.';

  navigator.geolocation.getCurrentPosition(
    position=>{
      const lat=position.coords.latitude;
      const lng=position.coords.longitude;
      const delta=0.035;
      const bbox=[
        (lng-delta).toFixed(6),
        (lat-delta).toFixed(6),
        (lng+delta).toFixed(6),
        (lat+delta).toFixed(6)
      ].join('%2C');

      map.src='https://www.openstreetmap.org/export/embed.html?bbox='+bbox+
        '&layer=mapnik&marker='+lat.toFixed(6)+'%2C'+lng.toFixed(6);

      coords.textContent=`Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      status.textContent='Location detected successfully. The map is centered on your current position.';
      searchBtn.href='https://www.google.com/maps/search/?api=1&query=blood+banks+near+'+lat+','+lng;
      openBtn.href='https://www.openstreetmap.org/?mlat='+lat+'&mlon='+lng+'#map=14/'+lat+'/'+lng;

      button.disabled=false;
      button.textContent='Refresh My Location';
    },
    error=>{
      let message='Unable to detect your location.';
      if(error.code===1) message='Location permission was denied. Allow location access and try again.';
      if(error.code===2) message='Your location could not be determined. Check location services and try again.';
      if(error.code===3) message='Location request timed out. Please try again.';
      status.textContent=message;
      button.disabled=false;
      button.textContent='Try Again';
    },
    {enableHighAccuracy:true, timeout:10000, maximumAge:30000}
  );
}

loadDashboard();

setInterval(()=>{
 const activeView=document.querySelector('.view.active');
 if(activeView && activeView.id==='dashboard'){
  loadDashboard();
 }
},30000);








