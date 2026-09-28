const $ = s => document.querySelector(s);
const money = n => '$' + n.toFixed(2);
const state = {cat:'All', q:'', sort:'featured'};
let ecoTotal = +(localStorage.getItem('rw_eco')||0);

function toast(msg){ const t=$('#toast'); t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2200); }

function renderChips(){
  const cats = ['All', ...new Set(PRODUCTS.map(p=>p.category))];
  $('#chips').innerHTML = cats.map(c=>`<button class="chip ${c===state.cat?'on':''}" data-cat="${c}">${c}</button>`).join('');
}

function renderGrid(){
  let list = PRODUCTS.filter(p => (state.cat==='All'||p.category===state.cat) &&
    (p.name+p.category+p.desc).toLowerCase().includes(state.q.toLowerCase()));
  if(state.sort==='low') list.sort((a,b)=>a.daily-b.daily);
  if(state.sort==='high') list.sort((a,b)=>b.daily-a.daily);
  if(state.sort==='eco') list.sort((a,b)=>b.co2-a.co2);
  $('#grid').innerHTML = list.length ? list.map(p=>{
    const left = p.stock - Cart.inCart(p.id);
    return `<div class="card">
      <div class="em">${p.emoji}</div>
      <span class="cat">${p.category}</span><h3>${p.name}</h3>
      <span class="badge ${left<=2?'low':''}">${left>0?left+' available':'Out of stock'}</span>
      <div class="price">${money(p.daily)} <small>/ day</small></div>
      <button class="btn" data-rent="${p.id}" ${left<1?'disabled':''}>Rent now</button>
    </div>`;}).join('') : '<p style="padding:20px">No gadgets match your search 🔍</p>';
}

function updateBadge(){ $('#cartCount').textContent = Cart.items.length; }

function countUp(){
  const el=$('#ecoNum'), end=ecoTotal, start=+el.dataset.v||0, t0=performance.now();
  (function step(t){ const k=Math.min(1,(t-t0)/600); el.textContent=Math.round(start+(end-start)*k); if(k<1) requestAnimationFrame(step); else el.dataset.v=end; })(t0);
}

function openModal(id){
  const p = PRODUCTS.find(x=>x.id===id);
  const today = new Date().toISOString().slice(0,10);
  $('#modalBox').innerHTML = `
    <div style="font-size:3rem">${p.emoji}</div>
    <h2>${p.name}</h2><p style="color:var(--muted)">${p.desc}</p>
    <div class="specs">${p.specs.map(s=>`<span>${s}</span>`).join('')}<span>🌱 ${p.co2}kg CO₂ saved</span></div>
    <div class="field"><label>Start date</label><input type="date" id="start" min="${today}" value="${today}"></div>
    <div class="field"><label>Rental length: <b id="dayLbl">3</b> days</label>
      <input type="range" id="days" min="1" max="30" value="3"></div>
    <label><input type="checkbox" id="prot"> 🛡️ Add damage protection</label>
    <div class="quote" id="quote" style="margin-top:14px"></div>
    <div style="margin-top:12px;font-size:.85rem">🏷️ Rent-to-own credit: <b id="credPct"></b> of purchase price (${money(p.buy)})
      <div class="meter"><i id="credBar"></i></div></div>
    <div class="row"><button class="btn ghost" id="closeModal">Cancel</button><button class="btn" id="addBtn">Add to cart</button></div>`;
  const upd = () => {
    const d=+$('#days').value, q=Pricing.quote(p,d,$('#prot').checked);
    $('#dayLbl').textContent=d;
    $('#quote').innerHTML = `
      <div><span>${money(p.daily)} × ${d} days</span><span>${money(q.base)}</span></div>
      ${q.disc?`<div style="color:var(--brand2)"><span>Long-rental discount (${Pricing.discountRate(d)*100}%)</span><span>−${money(q.disc)}</span></div>`:''}
      ${q.prot?`<div><span>Damage protection</span><span>${money(q.prot)}</span></div>`:''}
      <div><span>Refundable deposit</span><span>${money(p.deposit)}</span></div>
      <div class="tot"><span>Rent total</span><span>${money(q.total)}</span></div>`;
    $('#credPct').textContent = (q.credit*100).toFixed(1)+'%';
    $('#credBar').style.width = Math.min(100,q.credit*100*4)+'%';
  };
  $('#days').oninput = upd; $('#prot').onchange = upd; upd();
  $('#closeModal').onclick = () => $('#modal').classList.add('hidden');
  $('#addBtn').onclick = () => {
    Cart.add({pid:p.id, days:+$('#days').value, start:$('#start').value, protect:$('#prot').checked});
    $('#modal').classList.add('hidden'); updateBadge(); renderGrid(); toast(p.name+' added 🛒');
  };
  $('#modal').classList.remove('hidden');
}

function renderCart(done){
  if(done){
    $('#cartBody').innerHTML = `<div class="ok"><div class="big">🎉</div><h2>Booking confirmed!</h2>
      <p>Your reference:</p><code>${done.ref}</code>
      <p>💰 ${done.paid}</p>
      <p style="color:var(--muted)">We'll email delivery details. Thanks for choosing to rent instead of buy 🌍</p>
      <button class="btn" id="doneBtn">Keep browsing</button></div>`;
    $('#doneBtn').onclick = () => $('#drawer').classList.remove('open'); return;
  }
  if(!Cart.items.length){ $('#cartBody').innerHTML='<p style="color:var(--muted)">Your cart is empty. Time to find some gear! 🎒</p>'; return; }
  const t = Cart.totals();
  $('#cartBody').innerHTML = Cart.items.map((i,idx)=>{
    const p=PRODUCTS.find(x=>x.id===i.pid), q=Pricing.quote(p,i.days,i.protect);
    return `<div class="item"><div class="em">${p.emoji}</div>
      <div class="info"><b>${p.name}</b><br><small>${i.days} days from ${i.start}${i.protect?' · 🛡️':''}</small><br>${money(q.total)}</div>
      <button data-rm="${idx}" title="Remove">🗑️</button></div>`;}).join('') + `
    <div class="sum"><div><span>Rent</span><span>${money(t.rent)}</span></div>
      <div><span>Deposit (refundable)</span><span>${money(t.deposit)}</span></div>
      <div style="font-weight:800"><span>Due today</span><span>${money(t.due)}</span></div></div>
    <button class="btn" style="width:100%" id="checkout">Continue to payment</button>`;
  $('#checkout').onclick = renderPayment;
}

const payState = {method:'card'};

function payFormHtml(m){
  if(m==='card') return `
    <div class="field"><label>Name on card</label><input class="in" id="cardName" autocomplete="cc-name"></div>
    <div class="field"><label>Card number <span id="brand" class="brand"></span></label>
      <input class="in" id="cardNum" inputmode="numeric" placeholder="1234 5678 9012 3456" autocomplete="cc-number"></div>
    <div class="two"><div class="field"><label>Expiry</label><input class="in" id="cardExp" inputmode="numeric" placeholder="MM/YY" autocomplete="cc-exp"></div>
    <div class="field"><label>CVV</label><input class="in" id="cardCvv" inputmode="numeric" maxlength="4" placeholder="123" type="password" autocomplete="cc-csc"></div></div>`;
  if(m==='wallet') return `
    <div class="field"><label>Wallet</label><select class="in" id="walletProv"><option>PayPal</option><option>Apple Pay</option><option>Google Pay</option></select></div>
    <div class="field"><label>Email or phone linked to wallet</label><input class="in" id="walletId"></div>`;
  if(m==='bank') return `
    <div class="field"><label>Account holder name</label><input class="in" id="bankName"></div>
    <p class="note">You'll receive transfer instructions by email. Your booking is held for 24 hours.</p>`;
  return `<p class="note">Pay in cash or by card to the courier. A $5.00 handling fee applies and the refundable deposit is collected at handover.</p>`;
}

function renderPayment(){
  const t=Cart.totals(), m=Payment.methods.find(x=>x.id===payState.method), due=t.due+m.fee;
  $('#cartBody').innerHTML = `
    <button class="btn ghost" id="backCart" style="margin:10px 0">← Back to cart</button>
    <h3 style="margin:6px 0">Payment method</h3>
    <div class="pay-tiles">${Payment.methods.map(x=>`
      <button class="pay-tile ${x.id===m.id?'on':''}" data-pay="${x.id}"><span>${x.icon}</span>${x.label}${x.fee?`<small>+${money(x.fee)}</small>`:''}</button>`).join('')}</div>
    ${payFormHtml(m.id)}
    <div class="sum"><div><span>Rent</span><span>${money(t.rent)}</span></div>
      <div><span>Deposit (refundable)</span><span>${money(t.deposit)}</span></div>
      ${m.fee?`<div><span>Handling fee</span><span>${money(m.fee)}</span></div>`:''}
      <div style="font-weight:800"><span>Total due</span><span>${money(due)}</span></div></div>
    <div id="payErr" class="err"></div>
    <button class="btn" style="width:100%" id="payBtn">${m.id==='cod'||m.id==='bank'?'Place booking':'Pay '+money(due)}</button>
    <p class="note">🔒 Card details are checked in your browser and never stored.</p>`;
  $('#backCart').onclick = () => renderCart();
  $('#payBtn').onclick = submitPayment;
  const num=$('#cardNum'), exp=$('#cardExp');
  if(num) num.oninput = () => { num.value=Payment.formatCard(num.value); $('#brand').textContent=Payment.brand(Payment.digits(num.value))!=='Card'?Payment.brand(Payment.digits(num.value)):''; };
  if(exp) exp.oninput = () => { exp.value=Payment.formatExpiry(exp.value); };
}

function submitPayment(){
  const v = id => ($('#'+id)||{}).value||'';
  const method = payState.method;
  const f = {name:v('cardName'), num:v('cardNum'), exp:v('cardExp'), cvv:v('cardCvv'), walletId:v('walletId'), bankName:v('bankName')};
  const err = Payment.validate(method, f);
  $('#payErr').textContent = err;
  if(err) return;
  let paid = Payment.methods.find(x=>x.id===method).label;
  if(method==='card'){ const n=Payment.digits(f.num); paid = `Paid with ${Payment.brand(n)} •••• ${n.slice(-4)}`; }
  else if(method==='wallet') paid = `Paid with ${v('walletProv')}`;
  else if(method==='bank') paid = 'Bank transfer pending (instructions emailed)';
  else paid = 'Pay on delivery';
  const btn=$('#payBtn'); btn.disabled=true; btn.textContent='Processing…';
  setTimeout(()=>checkout(paid), 900);
}

function checkout(paid){
  ecoTotal += Cart.items.reduce((s,i)=>s+PRODUCTS.find(x=>x.id===i.pid).co2,0);
  try{ localStorage.setItem('rw_eco', ecoTotal); }catch(e){}
  const ref = 'RW-' + Math.random().toString(36).slice(2,8).toUpperCase();
  Cart.clear(); updateBadge(); renderGrid(); countUp(); renderCart({ref, paid});
}

// Events
document.addEventListener('click', e=>{
  const t=e.target;
  if(t.dataset.pay){ payState.method=t.dataset.pay; renderPayment(); }
  if(t.dataset.cat){ state.cat=t.dataset.cat; renderChips(); renderGrid(); }
  if(t.dataset.rent) openModal(+t.dataset.rent);
  if(t.dataset.rm!==undefined){ Cart.remove(+t.dataset.rm); updateBadge(); renderCart(); renderGrid(); }
  if(t.id==='modal') t.classList.add('hidden');
});
$('#search').oninput = e => { state.q=e.target.value; renderGrid(); };
$('#sort').onchange = e => { state.sort=e.target.value; renderGrid(); };
$('#cartBtn').onclick = () => { renderCart(); $('#drawer').classList.add('open'); };
$('#closeCart').onclick = () => $('#drawer').classList.remove('open');
$('#themeBtn').onclick = () => {
  const d=document.documentElement, dark=d.dataset.theme!=='dark';
  d.dataset.theme = dark?'dark':'light'; $('#themeBtn').textContent = dark?'☀️':'🌙';
};

Cart.load(); renderChips(); renderGrid(); updateBadge(); countUp();
