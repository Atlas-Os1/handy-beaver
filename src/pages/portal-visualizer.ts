import { Context } from 'hono';
import { siteConfig } from '../../config/site.config';
import { getAdminFromCookie } from '../lib/auth';

const { business, theme } = siteConfig;

const navLayout = (title: string, body: string, customer?: any) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | ${business.name} Portal</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    :root{--p:${theme.colors.primary};--s:${theme.colors.secondary}}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f5;min-height:100vh}
    nav.pnav{background:linear-gradient(135deg,var(--p),var(--s));color:white;padding:1rem 2rem;display:flex;justify-content:space-between;align-items:center}
    .brand{display:flex;align-items:center;gap:.75rem;font-family:'Playfair Display',serif;font-size:1.25rem;font-weight:600}
    .brand img{width:40px;height:40px;border-radius:50%}
    .layout{display:grid;grid-template-columns:220px 1fr;min-height:calc(100vh - 60px)}
    aside{background:white;border-right:1px solid #e5e5e5;padding:1.5rem 0}
    aside a{display:flex;align-items:center;gap:.75rem;padding:.75rem 1.5rem;color:#333;text-decoration:none;border-left:3px solid transparent;transition:all .2s}
    aside a:hover{background:#f9f9f9}
    aside a.on{background:#fff5f0;border-left-color:var(--p);color:var(--p);font-weight:600}
    main{padding:2rem;max-width:1400px}
    .card{background:white;border-radius:12px;padding:1.5rem;box-shadow:0 2px 8px rgba(0,0,0,.05);margin-bottom:1.5rem}
    .btn{display:inline-flex;align-items:center;gap:.5rem;padding:.75rem 1.5rem;border-radius:8px;font-weight:600;cursor:pointer;border:none;font-size:1rem;text-decoration:none;transition:all .2s}
    .bp{background:var(--p);color:white}.bp:hover{filter:brightness(1.1)}
    .bs{background:#e5e7eb;color:#333}.bs:hover{background:#d1d5db}
    .sm{padding:.5rem 1rem;font-size:.85rem}
    .btn:disabled{opacity:.5;cursor:not-allowed}
    @media(max-width:768px){.layout{grid-template-columns:1fr}aside{display:flex;overflow-x:auto;padding:.5rem;border-right:none;border-bottom:1px solid #e5e5e5}aside a{padding:.5rem 1rem;border-left:none;white-space:nowrap}}
  </style>
</head>
<body>
  <nav class="pnav">
    <div class="brand"><img src="/beaver-avatar.png" alt="HB"><span>My Account</span></div>
    <div style="display:flex;align-items:center;gap:1rem">
      <span>&#128075; ${customer?.name || 'Customer'}</span>
      <a href="/portal/logout" style="color:rgba(255,255,255,.8)">Logout</a>
    </div>
  </nav>
  <div class="layout">
    <aside>
      <a href="/portal">&#127968; Dashboard</a>
      <a href="/portal/quotes">&#128176; My Quotes</a>
      <a href="/portal/invoices">&#128196; Invoices</a>
      <a href="/portal/jobs">&#128736;&#65039; Job History</a>
      <a href="/portal/messages">&#128172; Messages</a>
      <a href="/portal/visualizer" class="on">&#10024; AI Design Studio</a>
      <a href="/portal/gallery">&#128444;&#65039; My Gallery</a>
    </aside>
    <main>${body}</main>
  </div>
</body></html>`;

export const portalGalleryPage = async (c: Context) => {
  const customer = c.get('customer');
  const customerId = customer?.customer_id;
  if (!customerId) return c.redirect('/portal/login');

  const startOfDay = Math.floor(new Date().setHours(0,0,0,0)/1000);
  const usageToday = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM visualizer_usage WHERE customer_id=? AND created_at>=?`
  ).bind(customerId, startOfDay).first<{count:number}>();
  const gallery = await c.env.DB.prepare(
    `SELECT * FROM visualizer_usage WHERE customer_id=? ORDER BY created_at DESC LIMIT 50`
  ).bind(customerId).all();
  const now = Math.floor(Date.now()/1000);
  const thirtyDays = 30*24*60*60;
  const limit = customer?.status === 'active' ? 10 : 3;
  const usedToday = usageToday?.count || 0;
  const pct = Math.min(100, (usedToday / limit) * 100);

  // Build gallery items without nested template literals
  let galleryHtml = '';
  if (gallery.results?.length) {
    const items = gallery.results as any[];
    for (const item of items) {
      const daysLeft = Math.ceil((item.created_at + thirtyDays - now) / 86400);
      const isSaved = item.saved_indefinitely === 1;
      const promptText = (item.prompt || 'No prompt').replace(/^\[.*?\]\s*/i, '');
      const dateStr = new Date(item.created_at * 1000).toLocaleDateString();
      const expiryBadge = isSaved
        ? '<span style="background:#d1fae5;color:#065f46;padding:2px 8px;border-radius:10px;font-size:.7rem">&#10003; Saved</span>'
        : '<span style="background:#fef3c7;color:#92400e;padding:2px 8px;border-radius:10px;font-size:.7rem">' + daysLeft + 'd left</span>';
      const keepBtn = !isSaved
        ? '<button onclick="saveViz(' + item.id + ')" class="btn bp sm">&#128190; Keep</button>'
        : '';
      galleryHtml += '<div style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">'
        + '<img src="' + (item.result_url || '') + '" style="width:100%;height:200px;object-fit:cover" onerror="this.src=\'/beaver-avatar.png\'">'
        + '<div style="padding:1rem">'
        + '<div style="font-size:.9rem;color:#333;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">' + promptText + '</div>'
        + '<div style="font-size:.8rem;color:#999;display:flex;justify-content:space-between;margin-top:.5rem">'
        + '<span>' + dateStr + '</span>' + expiryBadge
        + '</div></div>'
        + '<div style="display:flex;gap:.5rem;padding:0 1rem 1rem">'
        + '<a href="' + (item.result_url || '') + '" download class="btn bs sm" style="flex:1;text-align:center">&#128229; Download</a>'
        + keepBtn
        + '</div></div>';
    }
    galleryHtml = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1.5rem">' + galleryHtml + '</div>';
  } else {
    galleryHtml = '<div class="card" style="text-align:center;padding:3rem">'
      + '<div style="font-size:4rem;margin-bottom:1rem">&#127912;</div>'
      + '<h3 style="color:var(--p);margin-bottom:.5rem">No visualizations yet</h3>'
      + '<a href="/portal/visualizer" class="btn bp" style="margin-top:1rem">&#10024; Try the Design Studio</a>'
      + '</div>';
  }

  const body = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem">
      <h1 style="color:var(--p);font-family:'Playfair Display',serif">&#128444;&#65039; My Visualizations</h1>
      <a href="/portal/visualizer" class="btn bp">&#10024; Create New</a>
    </div>
    <div class="card" style="display:flex;gap:2rem;align-items:center">
      <div style="flex:1">
        <div style="font-size:.9rem;color:#666;margin-bottom:.25rem">Today's Usage</div>
        <div style="font-size:1.5rem;font-weight:600;color:var(--p)">${usedToday} / ${limit}</div>
        <div style="background:#e5e7eb;border-radius:10px;height:8px;overflow:hidden;margin:.5rem 0">
          <div style="background:var(--p);height:100%;width:${pct}%"></div>
        </div>
      </div>
      <div style="text-align:right">
        <div style="font-size:.9rem;color:#666">Total</div>
        <div style="font-size:1.5rem;font-weight:600">${gallery.results?.length || 0}</div>
      </div>
    </div>
    ${galleryHtml}
    <script>async function saveViz(id){const r=await fetch('/api/visualize/save/'+id,{method:'POST'});if(r.ok)location.reload();else alert('Failed')}</script>`;
  return c.html(navLayout('My Gallery', body, customer));
};

export const portalVisualizerPage = async (c: Context) => {
  const db = c.env.DB;
  const cookie = c.req.header('Cookie') || '';
  const portalToken = cookie.match(/hb_portal=([^;]+)/)?.[1];
  const adminToken = cookie.match(/hb_admin=([^;]+)/)?.[1];
  if (!portalToken && !adminToken) return c.redirect('/portal/login');

  const now = Math.floor(Date.now()/1000);
  let customer: any = null;
  let isAdmin = false;

  if (adminToken) {
    const adm = await getAdminFromCookie(db, adminToken, (c.env as { ADMIN_API_KEY?: string }).ADMIN_API_KEY);
    if (adm) isAdmin = true;
  }
  if (!isAdmin && portalToken) {
    customer = await db.prepare(
      `SELECT cs.*,c.* FROM customer_sessions cs JOIN customers c ON cs.customer_id=c.id WHERE cs.token=? AND cs.expires_at>?`
    ).bind(portalToken, now).first<any>();
    if (!customer) return c.redirect('/portal/login');
  }

  const usageLimits: Record<string,number> = {lead:3,prospect:3,quote:3,active:10,completed:5};
  const limit = isAdmin ? 999 : (usageLimits[customer?.status] || 3);
  const startOfDay = Math.floor(new Date().setHours(0,0,0,0)/1000);
  const usage = isAdmin ? {count:0} : await db.prepare(
    `SELECT COUNT(*) as count FROM visualizer_usage WHERE customer_id=? AND created_at>=?`
  ).bind(customer?.customer_id, startOfDay).first<{count:number}>();
  const remaining = isAdmin ? 999 : Math.max(0, limit - (usage?.count || 0));

  const badgeStyle = isAdmin
    ? 'background:var(--p);color:white'
    : remaining > 0 ? 'background:#d1fae5;color:#065f46' : 'background:#fee2e2;color:#991b1b';
  const badgeText = isAdmin
    ? '&#128293; Admin &mdash; Unlimited'
    : remaining + ' / ' + limit + ' remaining';
  const vbtnDisabled = !isAdmin && remaining <= 0 ? ' disabled' : '';

  const body = `
<style>
  @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
  .stab{transition:all .2s;border:2px solid #e5e7eb;border-radius:10px;padding:.8rem;text-align:center;cursor:pointer;background:white}
  .stab:hover,.stab.on{border-color:var(--p);background:#fff5f0}
  .atab{transition:all .2s;padding:.5rem 1.1rem;font-size:.9rem}
</style>
<div style="margin-bottom:1.5rem">
  <h1 style="font-family:'Playfair Display',serif;color:var(--p);font-size:2rem;margin-bottom:.25rem">&#10024; AI Cabin Design Studio</h1>
  <p style="color:#666">Upload a photo, pick your style, and see your project transformed</p>
</div>

<div style="display:flex;gap:.5rem;margin-bottom:.5rem;flex-wrap:wrap">
  <button class="btn atab bp" data-a="remodel" data-d="Interior renovations: bathroom, kitchen, flooring, walls">&#127968; Remodel</button>
  <button class="btn atab bs" data-a="addition" data-d="New spaces: rooms, decks, covered porches">&#128296; Addition</button>
  <button class="btn atab bs" data-a="signs" data-d="Custom cedar signs visualized on your property">&#129717; Sign Creator</button>
  <button class="btn atab bs" data-a="materials" data-d="Preview stain colors, wood species, and finishes">&#127912; Materials</button>
</div>
<p id="adesc" style="color:#666;font-size:.9rem;margin-bottom:1.5rem">Interior renovations: bathroom, kitchen, flooring, walls</p>

<div class="card">
  <h3 style="color:var(--p);margin-bottom:.75rem">Choose Your Style</h3>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:.75rem">
    <div class="stab on" data-s="rustic-cedar"><div style="font-size:1.8rem;margin-bottom:.4rem">&#129717;</div><strong style="font-size:.85rem;color:var(--p)">Rustic Cedar</strong><div style="font-size:.75rem;color:#666;margin-top:.2rem">Cedar shiplap, knotty pine</div></div>
    <div class="stab" data-s="mountain-lodge"><div style="font-size:1.8rem;margin-bottom:.4rem">&#9968;&#65039;</div><strong style="font-size:.85rem;color:var(--p)">Mountain Lodge</strong><div style="font-size:.75rem;color:#666;margin-top:.2rem">Blue pine, stone accents</div></div>
    <div class="stab" data-s="modern-farmhouse"><div style="font-size:1.8rem;margin-bottom:.4rem">&#127806;</div><strong style="font-size:.85rem;color:var(--p)">Modern Farmhouse</strong><div style="font-size:.75rem;color:#666;margin-top:.2rem">White shiplap, black metal</div></div>
    <div class="stab" data-s="lakeside-retreat"><div style="font-size:1.8rem;margin-bottom:.4rem">&#127966;&#65039;</div><strong style="font-size:.85rem;color:var(--p)">Lakeside Retreat</strong><div style="font-size:.75rem;color:#666;margin-top:.2rem">Smooth T&amp;G, whitewash</div></div>
  </div>
</div>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;align-items:start">
  <div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
      <h2 style="color:var(--p);margin:0">Design Your Project</h2>
      <span style="padding:.4rem .9rem;border-radius:20px;font-size:.85rem;font-weight:600;${badgeStyle}">${badgeText}</span>
    </div>
    <div id="dz" style="border:2px dashed #ccc;border-radius:12px;padding:2rem;text-align:center;cursor:pointer;background:#fafafa;transition:all .2s">
      <div style="font-size:2.5rem;margin-bottom:.5rem">&#128247;</div>
      <p style="color:#666;font-size:.9rem">Drag &amp; drop or click to upload</p>
      <p style="color:#999;font-size:.8rem">JPG, PNG up to 10MB</p>
      <input type="file" id="fi" accept="image/*" style="display:none">
    </div>
    <div id="pw" style="display:none;margin-top:.75rem;text-align:center">
      <img id="pp" style="max-width:100%;max-height:200px;border-radius:8px;display:block;margin:0 auto">
      <button id="cp" style="margin-top:.5rem;background:none;border:none;color:#999;cursor:pointer;font-size:.85rem">&#10005; Remove</button>
    </div>
    <div style="margin:.75rem 0">
      <label style="display:block;margin-bottom:.5rem;font-weight:600;color:#333">&#127912; Describe Your Vision</label>
      <textarea id="pi" rows="3" placeholder="Example: Replace the walls with knotty pine shiplap, add crown molding, dark walnut floors..." style="width:100%;padding:.75rem;border:2px solid #ddd;border-radius:8px;font-size:.95rem;resize:vertical;line-height:1.5"></textarea>
    </div>
    <div style="display:flex;gap:.75rem">
      <button id="vbtn" class="btn bp" style="flex:1"${vbtnDisabled}>&#10024; Visualize</button>
      <button id="qbtn" class="btn bs" style="flex:1">&#128176; Get Estimate</button>
    </div>
    <div id="epw" style="display:none;margin-top:.75rem;padding:.75rem;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px">
      <div style="font-size:.7rem;font-weight:700;color:#065f46;text-transform:uppercase;letter-spacing:.05em;margin-bottom:.25rem">&#10022; AI enhanced your prompt</div>
      <div id="ept" style="font-size:.85rem;color:#166534;line-height:1.5"></div>
    </div>
  </div>

  <div class="card">
    <div id="rph" style="text-align:center;padding:3rem 1rem;color:#999">
      <div style="font-size:3.5rem;margin-bottom:1rem">&#127969;</div>
      <p style="font-size:1rem;font-weight:500;color:#666">Your visualization will appear here</p>
      <p style="font-size:.85rem;margin-top:.5rem">Upload a photo and describe your changes</p>
    </div>
    <div id="baw" style="display:none">
      <h3 style="color:var(--p);margin-bottom:.75rem">Before &rarr; After</h3>
      <div id="cc" style="position:relative;overflow:hidden;border-radius:10px;cursor:col-resize;user-select:none;background:#000" onmousedown="sd(event)" ontouchstart="st(event)">
        <img id="ai" style="display:block;width:100%;height:auto">
        <div id="bc" style="position:absolute;top:0;left:0;width:50%;height:100%;overflow:hidden">
          <img id="bi" style="display:block;width:100%;height:100%;object-fit:cover;max-width:none">
        </div>
        <div id="sl" style="position:absolute;top:0;left:50%;width:3px;height:100%;background:white;box-shadow:0 0 8px rgba(0,0,0,.5);transform:translateX(-50%)">
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:32px;height:32px;background:white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center">&#8660;</div>
        </div>
      </div>
      <p style="text-align:center;font-size:.8rem;color:#999;margin-top:.5rem">Drag to compare</p>
      <div style="display:flex;gap:.75rem;margin-top:.75rem">
        <button id="dlbtn" class="btn bs sm" style="flex:1">&#128229; Download</button>
        <button id="newbtn" class="btn bp sm" style="flex:1">&#128260; Try Another</button>
      </div>
    </div>
    <div id="gst" style="display:none;text-align:center;padding:3rem 1rem">
      <div style="font-size:3rem;margin-bottom:1rem;display:inline-block;animation:spin 2s linear infinite">&#9881;&#65039;</div>
      <p style="font-size:1rem;color:var(--p);font-weight:600">Generating visualization...</p>
      <p style="font-size:.85rem;color:#666;margin-top:.5rem">Takes about 20-40 seconds</p>
    </div>
  </div>
</div>

<div id="qs" class="card" style="display:none;margin-top:0">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
    <h2 style="color:var(--p);margin:0">&#128176; Instant Project Quote</h2>
    <span id="qtb" style="background:var(--p);color:white;padding:.4rem 1rem;border-radius:20px;font-weight:700;font-size:1.1rem"></span>
  </div>
  <p id="qsum" style="color:#555;margin-bottom:1rem;font-size:.95rem;line-height:1.6"></p>
  <div style="overflow-x:auto">
    <table style="width:100%;border-collapse:collapse;font-size:.9rem">
      <thead><tr style="background:#f9f9f9">
        <th style="text-align:left;padding:.75rem;border-bottom:2px solid #eee;color:#666;font-size:.75rem;text-transform:uppercase">Type</th>
        <th style="text-align:left;padding:.75rem;border-bottom:2px solid #eee;color:#666;font-size:.75rem;text-transform:uppercase">Description</th>
        <th style="text-align:right;padding:.75rem;border-bottom:2px solid #eee;color:#666;font-size:.75rem;text-transform:uppercase">Qty</th>
        <th style="text-align:left;padding:.75rem;border-bottom:2px solid #eee;color:#666;font-size:.75rem;text-transform:uppercase">Unit</th>
        <th style="text-align:right;padding:.75rem;border-bottom:2px solid #eee;color:#666;font-size:.75rem;text-transform:uppercase">$/Unit</th>
        <th style="text-align:right;padding:.75rem;border-bottom:2px solid #eee;color:#666;font-size:.75rem;text-transform:uppercase">Total</th>
      </tr></thead>
      <tbody id="qtbody"></tbody>
      <tfoot><tr>
        <td colspan="5" style="padding:.75rem;font-weight:700;text-align:right;border-top:2px solid #eee;color:var(--p)">TOTAL ESTIMATE</td>
        <td id="qtot" style="padding:.75rem;font-weight:700;text-align:right;border-top:2px solid #eee;color:var(--p);font-size:1.1rem"></td>
      </tr></tfoot>
    </table>
  </div>
  <div style="margin-top:.75rem;padding:.75rem;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;font-size:.8rem;color:#92400e">
    &#9888;&#65039; Preliminary estimate. Final pricing requires on-site assessment.
  </div>
  <div style="margin-top:1rem"><a href="/contact" class="btn bp">&#128222; Get Free Quote &rarr;</a></div>
</div>

<script>
var area='remodel',sty='rustic-cedar',file=null,resUrl=null,origUrl=null,uid=null,drag=false;
var styleMap={
  'rustic-cedar':'Raw cedar shiplap, knotty pine, dark iron hardware, weathered wood tones',
  'mountain-lodge':'Beetle kill blue pine, stone accents, heavy timber, warm amber lighting',
  'modern-farmhouse':'Clean white shiplap, black metal accents, light oak floors, contemporary',
  'lakeside-retreat':'Smooth pine T&G, whitewash finish, nautical touches, light and airy'
};
document.querySelectorAll('.atab').forEach(function(b){
  b.addEventListener('click',function(){
    area=b.dataset.a;document.getElementById('adesc').textContent=b.dataset.d;
    document.querySelectorAll('.atab').forEach(function(x){x.className='btn atab bs'});
    b.className='btn atab bp';
  });
});
document.querySelectorAll('.stab').forEach(function(c){
  c.addEventListener('click',function(){
    sty=c.dataset.s;
    document.querySelectorAll('.stab').forEach(function(x){x.classList.remove('on')});
    c.classList.add('on');
  });
});
var dz=document.getElementById('dz'),fi=document.getElementById('fi');
dz.addEventListener('click',function(){fi.click()});
dz.addEventListener('dragover',function(e){e.preventDefault();dz.style.borderColor='var(--p)'});
dz.addEventListener('dragleave',function(){dz.style.borderColor='#ccc'});
dz.addEventListener('drop',function(e){
  e.preventDefault();dz.style.borderColor='#ccc';
  if(e.dataTransfer.files.length)hf(e.dataTransfer.files[0]);
});
fi.addEventListener('change',function(e){if(e.target.files.length)hf(e.target.files[0])});
document.getElementById('cp').addEventListener('click',function(){
  file=null;fi.value='';
  document.getElementById('pw').style.display='none';
  dz.style.display='block';
});
function hf(f){
  if(!f.type.startsWith('image/')){alert('Please upload an image');return}
  if(f.size>10485760){alert('Max 10MB');return}
  file=f;
  var r=new FileReader();
  r.onload=function(e){
    origUrl=e.target.result;
    document.getElementById('pp').src=e.target.result;
    document.getElementById('pw').style.display='block';
    dz.style.display='none';
  };
  r.readAsDataURL(f);
}
document.getElementById('vbtn').addEventListener('click',async function(){
  var p=document.getElementById('pi').value.trim();
  if(!file){alert('Please upload a photo first');return}
  if(!p){alert('Please describe the changes you want');return}
  sg(true);
  try{
    var fd=new FormData();
    fd.append('image',file);
    fd.append('prompt',p+'. Style: '+styleMap[sty]);
    fd.append('style',sty);
    var r=await fetch('/api/visualize/generate',{method:'POST',body:fd});
    var d=await r.json();
    if(!d.success)throw new Error(d.error||'Generation failed');
    uid=d.usageId;resUrl=d.resultUrl;
    if(d.enhancedPrompt&&d.enhancedPrompt!==p){
      document.getElementById('ept').textContent=d.enhancedPrompt;
      document.getElementById('epw').style.display='block';
    }
    sba(origUrl,d.resultUrl);
  }catch(e){sg(false);alert('Error: '+e.message)}
});
function sg(on){
  document.getElementById('gst').style.display=on?'block':'none';
  document.getElementById('rph').style.display=on?'none':(resUrl?'none':'block');
  document.getElementById('baw').style.display=on?'none':(resUrl?'block':'none');
  document.getElementById('vbtn').disabled=on;
  document.getElementById('vbtn').textContent=on?'Generating...':'&#10024; Visualize';
}
function sba(bef,aft){
  document.getElementById('bi').src=bef;
  document.getElementById('ai').src=aft;
  sg(false);
}
function upsl(x){
  var cc=document.getElementById('cc'),r=cc.getBoundingClientRect();
  var pct=Math.max(0,Math.min(100,((x-r.left)/r.width)*100));
  document.getElementById('bc').style.width=pct+'%';
  document.getElementById('sl').style.left=pct+'%';
}
function sd(e){drag=true;upsl(e.clientX);document.addEventListener('mousemove',md);document.addEventListener('mouseup',su)}
function st(e){drag=true;upsl(e.touches[0].clientX);document.addEventListener('touchmove',tm,{passive:false});document.addEventListener('touchend',su)}
function md(e){if(drag)upsl(e.clientX)}
function tm(e){e.preventDefault();if(drag)upsl(e.touches[0].clientX)}
function su(){drag=false;document.removeEventListener('mousemove',md);document.removeEventListener('mouseup',su);document.removeEventListener('touchmove',tm);document.removeEventListener('touchend',su)}
document.getElementById('dlbtn').addEventListener('click',function(){
  if(!resUrl)return;var a=document.createElement('a');a.href=resUrl;a.download='visualization.jpg';a.click();
});
document.getElementById('newbtn').addEventListener('click',function(){
  resUrl=null;uid=null;
  document.getElementById('rph').style.display='block';
  document.getElementById('baw').style.display='none';
  document.getElementById('epw').style.display='none';
  document.getElementById('qs').style.display='none';
  document.getElementById('cp').click();
  document.getElementById('pi').value='';
});
document.getElementById('qbtn').addEventListener('click',async function(){
  var p=document.getElementById('pi').value.trim();
  if(!p){alert('Please describe your project first');return}
  var qs=document.getElementById('qs'),qbtn=document.getElementById('qbtn');
  qs.style.display='block';qbtn.disabled=true;qbtn.textContent='Estimating...';
  document.getElementById('qtbody').innerHTML='<tr><td colspan="6" style="padding:1rem;text-align:center;color:#999">Generating estimate...</td></tr>';
  document.getElementById('qtb').textContent='';
  document.getElementById('qtot').textContent='';
  document.getElementById('qsum').textContent='';
  qs.scrollIntoView({behavior:'smooth',block:'nearest'});
  try{
    var r=await fetch('/api/visualize/quote',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({project_type:area,style:sty,description:p,usage_id:uid})
    });
    var d=await r.json();
    if(!r.ok)throw new Error(d.error||'Failed');
    rq(d);
  }catch(e){
    document.getElementById('qtbody').innerHTML='<tr><td colspan="6" style="padding:1rem;text-align:center;color:#991b1b">&#9888;&#65039; '+e.message+'</td></tr>';
  }finally{
    qbtn.disabled=false;qbtn.textContent='&#128176; Get Estimate';
  }
});
function rq(d){
  var items=d.line_items||[],tot=d.total_amount||0;
  document.getElementById('qsum').textContent=d.summary||'';
  document.getElementById('qtb').textContent='$'+tot.toLocaleString('en-US',{minimumFractionDigits:0});
  document.getElementById('qtot').textContent='$'+tot.toLocaleString('en-US',{minimumFractionDigits:2});
  document.getElementById('qtbody').innerHTML=items.map(function(it){
    var tc=it.type==='LABOR'?'#dbeafe':'#dcfce7',tx=it.type==='LABOR'?'#1d4ed8':'#166534';
    return '<tr style="border-bottom:1px solid #f3f4f6">'
      +'<td style="padding:.75rem"><span style="background:'+tc+';color:'+tx+';padding:2px 8px;border-radius:10px;font-size:.75rem;font-weight:600">'+it.type+'</span></td>'
      +'<td style="padding:.75rem;font-weight:500">'+it.description+'</td>'
      +'<td style="padding:.75rem;text-align:right;color:#555">'+it.qty+'</td>'
      +'<td style="padding:.75rem;color:#555">'+it.unit+'</td>'
      +'<td style="padding:.75rem;text-align:right;color:#555">$'+Number(it.price_per_unit).toFixed(2)+'</td>'
      +'<td style="padding:.75rem;text-align:right;font-weight:600;color:var(--p)">$'+Number(it.total).toFixed(2)+'</td></tr>';
  }).join('');
}
</script>`;
  return c.html(navLayout('AI Design Studio', body, isAdmin ? {name:'Admin'} : customer));
};
