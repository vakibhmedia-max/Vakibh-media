const idx=require('../Vakibh-media/Vakibh/data/search-index.json');
const norm=s=>String(s||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[।॥.,:;!?()\[\]{}"'`~|/\\_-]+/g,' ').replace(/\s+/g,' ').trim();
const score=(e,q)=>{const nq=norm(q),terms=nq.split(' ').filter(Boolean),search=norm(e.searchText||[e.title,e.heading,e.saint,e.type,e.excerpt,e.aliases].join(' ')); if(!terms.every(t=>search.includes(t))) return -1; return (norm(e.title).includes(nq)?120:0)+(norm(e.saint).includes(nq)?70:0)+(norm(e.aliases).includes(nq)?55:0)+(norm(e.excerpt).includes(nq)?15:0)};
for (const q of ['Dnyaneshwar','Tukaram','Haripath','Hari Mukhe Mhna','ज्ञानदेव','तुकाराम']) {
 const r=idx.map(e=>({...e,score:score(e,q)})).filter(e=>e.score>=0).sort((a,b)=>b.score-a.score).slice(0,3);
 console.log('\n'+q); console.log(r.map(x=>`${x.title} -> ${x.path}`).join('\n'));
}
