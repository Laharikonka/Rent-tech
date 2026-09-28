// Pricing rules + cart state (persisted in localStorage).
const Pricing = {
  // Longer rentals = bigger discount
  discountRate(days){ return days>=30?0.25 : days>=14?0.20 : days>=7?0.10 : 0; },
  PROTECT_RATE: 0.15, // damage protection = 15% of daily rate per day
  RENT_TO_OWN: 0.5,   // 50% of rent counts toward purchase
  quote(p, days, protect){
    const base = p.daily*days;
    const disc = base*this.discountRate(days);
    const prot = protect ? p.daily*this.PROTECT_RATE*days : 0;
    const total = base - disc + prot;
    const credit = Math.min(1, ((base-disc)*this.RENT_TO_OWN)/p.buy);
    return {base, disc, prot, total, credit};
  }
};

const Cart = {
  items: [],
  load(){ try{ this.items = JSON.parse(localStorage.getItem('rw_cart')||'[]'); }catch(e){ this.items=[]; } },
  save(){ try{ localStorage.setItem('rw_cart', JSON.stringify(this.items)); }catch(e){} },
  inCart(pid){ return this.items.filter(i=>i.pid===pid).length; },
  add(item){ this.items.push(item); this.save(); },
  remove(idx){ this.items.splice(idx,1); this.save(); },
  clear(){ this.items=[]; this.save(); },
  totals(){
    let rent=0, deposit=0;
    this.items.forEach(i=>{
      const p = PRODUCTS.find(x=>x.id===i.pid);
      rent += Pricing.quote(p,i.days,i.protect).total;
      deposit += p.deposit;
    });
    return {rent, deposit, due: rent+deposit};
  }
};

// Payment methods + validation. Card details are validated in-browser only and
// are never saved; only the brand and last 4 digits appear on the confirmation.
const Payment = {
  methods: [
    {id:'card',   label:'Card',            icon:'💳', fee:0},
    {id:'wallet', label:'Digital wallet',  icon:'👛', fee:0},
    {id:'bank',   label:'Bank transfer',   icon:'🏦', fee:0},
    {id:'cod',    label:'Pay on delivery', icon:'💵', fee:5}
  ],
  digits(v){ return (v||'').replace(/\D/g,''); },
  luhn(num){
    let sum=0, alt=false;
    for(let i=num.length-1;i>=0;i--){
      let n=+num[i]; if(alt){ n*=2; if(n>9) n-=9; } sum+=n; alt=!alt;
    }
    return num.length>0 && sum%10===0;
  },
  brand(num){
    if(/^4/.test(num)) return 'Visa';
    if(/^(5[1-5]|2[2-7])/.test(num)) return 'Mastercard';
    if(/^3[47]/.test(num)) return 'Amex';
    return 'Card';
  },
  formatCard(v){ return this.digits(v).slice(0,16).replace(/(.{4})/g,'$1 ').trim(); },
  formatExpiry(v){ const d=this.digits(v).slice(0,4); return d.length>2 ? d.slice(0,2)+'/'+d.slice(2) : d; },
  validExpiry(v){
    const m=/^(\d{2})\/(\d{2})$/.exec(v); if(!m) return false;
    const mo=+m[1], yr=2000+ +m[2]; if(mo<1||mo>12) return false;
    const now=new Date(); return yr>now.getFullYear() || (yr===now.getFullYear() && mo>=now.getMonth()+1);
  },
  // Returns an error message, or '' when valid.
  validate(method, f){
    if(method==='card'){
      const n=this.digits(f.num);
      if(!f.name.trim()) return 'Enter the name on the card.';
      if(n.length<13 || !this.luhn(n)) return 'That card number looks invalid.';
      if(!this.validExpiry(f.exp)) return 'Enter a valid, unexpired date (MM/YY).';
      if(!/^\d{3,4}$/.test(f.cvv)) return 'Enter the 3 or 4 digit security code.';
    }
    if(method==='wallet' && !/^\S+@\S+\.\S+$|^\+?\d{8,15}$/.test((f.walletId||'').trim()))
      return 'Enter the email or phone linked to your wallet.';
    if(method==='bank' && !f.bankName.trim()) return 'Enter the account holder name.';
    return '';
  }
};
