const directoryProjects = new Set(['schindler','lift-hold','kone','bayer','yantra']);
const customerSupport = 'ГТП, оферти, ремонти, връзка с клиенти';
const koneContacts = [
  ['София','Димитринка Кирилова Иванова',customerSupport,'0882 307 940','dimitrinka.kirilovaivanova@kone.com'],
  ['София','Ива Ангелинина','ГТП','0884 917 808','iva.angelinina@kone.com'],
  ['Варна','Миглена Статева','Оферти, ремонти, връзка с клиенти','0885 748 811','miglena.stateva@kone.com'],
  ['Варна','Деяна Георгиева','ГТП','0882 472 974','deyana.georgieva@kone.com'],
  ['Търговище, Попово, Омуртаг','Жасмина Янкова',customerSupport,'0878 342 397','jasmina.yankova@kone.com'],
  ['Бургас','Атанаска Славова',customerSupport,'0889 399 323','atanaska.slavova@kone.com'],
  ['Разград, Шумен, Русе','Десислава Черникова',customerSupport,'0884 307 303','desislava.chernikova@kone.com'],
  ['Цялата страна','Виктор Калчев','Отдел „Сервиз“ · Търговски представител','0889 530 730','victor.kalchev@kone.com']
];

function externalLink(label, url) {
  const link = el('a',label,'btn');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  return link;
}

function directoryTable(root, headers, rows, edit) {
  const wrapper = el('div',null,'tableResults directoryTable');
  const table = el('table');
  const head = table.createTHead().insertRow();
  for (const header of edit ? [...headers,'Действия'] : headers) {
    const cell = el('th',header);
    cell.scope = 'col';
    head.append(cell);
  }
  const body = table.createTBody();
  for (const row of rows) {
    const tr = body.insertRow();
    for (const value of row) tr.append(el('td',value || '—'));
    if (edit) {
      const cell = el('td');
      cell.append(button('Редактирай',()=>edit(row)));
      tr.append(cell);
    }
  }
  wrapper.append(table);
  root.append(wrapper);
}

function renderDirectory(project, root) {
  if (project === 'bayer') {
      directoryTable(root,['За какво','Телефон','Имейл'],[['Временен недостиг на лекарствени продукти на Байер България','+359 2 8140193','emergency.orders.bg@bayer.com']]);
      root.append(externalLink('Страница за контакт на Байер България','https://www.bayer.com/bg/bg/contact'));
    return;
  }
  const version = generation;
  const toolbar = el('div',null,'directoryTools');
  const statusLine = el('p',loadHint);
  statusLine.setAttribute('role','status');
  const results = el('div');
  const search = el('input');
  search.type = 'search';
  search.placeholder = 'Търсене';
  search.setAttribute('aria-label','Търсене в проекта');
  const headers = {
    schindler:['Comm №','Аларма','Обект','Адрес','Бележки'],
    'lift-hold':['Район','Контакт','Позиция','Служебен номер','Личен номер'],
    kone:['Район','Контакт','Отговаря за','Телефон','Имейл']
  };
  const sharedProject = {kone:'КОНЕ',yantra:'Янтра Технолоджи'}[project];
  const contacts = project === 'kone'
    ? koneContacts.map((row,index)=>({row,key:'kone-'+index}))
    : [
      {key:'yantra-0',row:['Парк Център','Охрана','','0894 814 112, 0895 559 153','']},
      {key:'yantra-1',row:['НДК','Бул. „България“ № 1, София','Контакт за обекта','0886 071 379','']},
      {key:'yantra-2',row:['НДК','Иван','Проблем с плащането или неработещ платежен апарат','0898 889 599','']},
      {key:'yantra-3',row:['НДК','Станимир','Собственик','0899 121 156','']}
    ];
  const regions = el('div',null,'directoryTools');
  regions.setAttribute('role','group');
  regions.setAttribute('aria-label','Район');
  let selectedRegion = '';
  let rows = null;
  function draw() {
    if (!rows || version !== generation) return;
    const query = norm(search.value.trim());
    const digits = query.replace(/\D/g,'');
    const phoneQuery = digits.length >= 3 && /^[+\d\s()./-]+$/.test(query);
    const region = selectedRegion;
    const filtered = rows.filter(row =>
      (project === 'schindler' || !region || row[0].split(', ').includes(region)) &&
      (!query || query.split(/\s+/).every(word => norm(row.join(' ')).includes(word)) ||
        (phoneQuery && row.some(value => value.replace(/\D/g,'').includes(digits))))
    );
    results.replaceChildren();
    statusLine.textContent = filtered.length ? 'Намерени: '+filtered.length : 'Няма записи за избраните критерии.';
    if (filtered.length) directoryTable(results,headers[project],filtered,
      sharedReady && project === 'kone' ? editContact : null);
  }
  function renderRegions(values) {
    regions.replaceChildren();
    for (const value of ['',...new Set(values.filter(Boolean))]) {
      const control = button(value || 'Всички райони',()=>{
        selectedRegion = value;
        for (const item of regions.children) {
          const active = item === control;
          item.setAttribute('aria-pressed',String(active));
          item.classList.toggle('secondary',!active);
        }
        draw();
      });
      control.setAttribute('aria-pressed',String(selectedRegion===value));
      control.classList.toggle('secondary',selectedRegion!==value);
      regions.append(control);
    }
  }
  function showSharedContacts() {
    rows = contacts.map(entry=>entry.row);
    if (project === 'kone') {
      renderRegions(rows.flatMap(row=>row[0].split(', ')));
      draw();
      return;
    }
    results.replaceChildren();
    statusLine.textContent = '';
    for (const group of new Set(rows.map(row=>row[0]))) {
      results.append(el('h3',group));
      directoryTable(results,['Контакт','За какво','Телефон','Имейл'],
        rows.filter(row=>row[0]===group).map(row=>row.slice(1)),
        sharedReady ? row=>editContact(rows.find(full=>full[0]===group && row.every((value,i)=>value===full[i+1]))) : null);
    }
  }
  let sharedReady = false;
  async function refreshShared() {
    try {
      const {results:records} = await protectedApi('privateList',{kind:'useful'});
      if (version !== generation) return;
      for (const record of records.filter(record=>record.project===sharedProject && record.note?.startsWith('hub-directory:'))) {
        const key = record.note.slice('hub-directory:'.length);
        const existing = contacts.findIndex(entry=>entry.key && entry.key===key || entry.id===record.id);
        const entry = {id:record.id,key,row:[record.city,record.title,record.body,record.phone,record.email].map(value=>value||'')};
        if (existing < 0) contacts.push(entry);
        else contacts[existing] = entry;
      }
      sharedReady = true;
      showSharedContacts();
    } catch (error) {
      if (version === generation) statusLine.textContent = error.message;
    }
  }
  function editContact(row) {
    if (!sharedReady) { statusLine.textContent = 'Записите за редакция още не са заредени.'; return; }
    if (root.querySelector('form')) return;
    const entry = contacts.find(contact=>contact.row===row);
    const form = el('form',null,'card');
    const fields = ['city','title','body','phone','email'];
    const labels = [project==='kone'?'Район':'Обект','Контакт','За какво','Телефон','Имейл'];
    fields.forEach((name,index)=>{
      const label = el('label',labels[index]);
      const input = el('input');
      input.name = name;
      input.value = row?.[index] || '';
      input.required = index===0 || index===1 || index===3;
      label.append(input);
      form.append(label);
    });
    const save = el('button','Запази');
    const message = el('p');
    message.setAttribute('role','status');
    form.append(save,button('Отказ',()=>form.remove()),message);
    form.onsubmit = async event=>{
      event.preventDefault();
      save.disabled = true;
      try {
        await protectedApi('privateSave',{kind:'useful',id:entry?.id,record:{
          ...values(form),project:sharedProject,note:'hub-directory:'+(entry?.key || '')
        }});
        form.remove();
        await refreshShared();
      } catch (error) {
        message.textContent = error.message;
      } finally {
        save.disabled = false;
      }
    };
    root.insertBefore(form,results);
    form.querySelector('input')?.focus();
  }
  async function load() {
    loadButton.disabled = true;
    statusLine.textContent = 'Зарежда се…';
    try {
      const next = (await protectedApi('hubDirectory',{kind:project})).results;
      if (version !== generation) return;
      rows = project === 'lift-hold' ? next.map(([region,...contact])=>[region === 'София 2' ? 'София' : region,...contact]) : next;
      if (project === 'lift-hold') renderRegions([...liftRegions,...rows.map(row=>row[0])]);
      draw();
    } catch (error) {
      if (version === generation) statusLine.textContent = error.message;
    } finally {
      loadButton.disabled = false;
    }
  }
  const loadButton = button('Зареди',load);
  if (headers[project]) toolbar.append(search);
  const liftRegions = ['София','Пловдив','Варна'];
  if (project === 'lift-hold') {
    renderRegions(liftRegions);
    toolbar.append(regions);
  }
  if (project === 'kone') root.append(el('p','За въпроси извън сервизното обслужване насочваме клиента към офисния телефон 02 969 7070 само в работно време до 17:00 ч.','directoryPriority'));
  if (sharedProject) {
    if (session) toolbar.append(button('Добави',()=>editContact()));
    else toolbar.append(button('Вход за редакция',()=>navigate('contacts')));
    if (project === 'kone') toolbar.append(regions);
  } else toolbar.append(loadButton);
  search.oninput = draw;
  root.append(toolbar,statusLine,results);
  if (sharedProject) {
    showSharedContacts();
    if (session) refreshShared();
  } else if (session) {
    load();
  }
}

function bfsaCentral(root) {
  root.append(el('h3','Централно управление'));
  const priorities = [
    ['Хуманно отношение към животните, приюти и лицензи за превоз на животни','02/915 9 892'],
    ['Влошено здравословно състояние на животни или инфекциозни болести','02/915 9 889'],
    ['Граничен контрол','02/915 9 868'],
    ['Деловодни справки','0882 469 328']
  ];
  const summary = el('ul');
  for (const [label, phone] of priorities) {
    const item = el('li');
    item.append(el('span',label,'directoryPriority'),document.createTextNode(' · '+phone));
    summary.append(item);
  }
  root.append(summary);
  directoryTable(root,['Направление','Телефон'],[
    ['Граничен контрол · стоки от животински произход и живи животни от трети страни','02/915 9 868'],
    ['Граничен контрол · храни и фуражи от неживотински произход, растения, растителни продукти и други обекти от определени трети страни','02/915 9 872'],
    ['Контрол на храните','02/915 9 831 · 02/915 9 844'],
    ['Регистрация на животновъдни обекти и идентификация (паспорти) на животни','02/915 9 893'],
    ['Лабораторен контрол','02/917 3 713'],
    ['Продукти за растителна защита, торове и контрол','02/917 3 717'],
    ['Контрол на фуражите и страничните животински продукти · СЖП','02/915 9 894'],
    ['Контрол на фуражите и страничните животински продукти · Фуражи','02/915 9 896']
  ]);
  const links = el('div',null,'quicklinks');
  const referrals = [
    ['Екоравновесие – подай сигнал','https://ecoravnovesie.sofia.bg/signal','За сигнали относно безстопанствени кучета на територията на София.'],
    ['HelpBook','https://helpbook.info/','За подаване на граждански сигнал през платформата до съответната институция.'],
    ['Столична община – сигнали','https://call.sofia.bg/','За неспешни общински проблеми в София като шум, осветление, пътища и чистота.'],
    ['Комисия за защита на потребителите','https://kzp.bg/','За потребителски жалби срещу търговци, например при проблем с рекламация или подвеждаща търговска практика. Телефон: 0700 11 122.']
  ];
  for (const [label,url,note] of referrals) {
    const item = el('div');
    item.append(externalLink(label,url),el('p',note));
    links.append(item);
  }
  root.append(links);
}
