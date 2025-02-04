const order = 'aāiīuūṛṝeēoōkgṅcjñṭḍṇtdnpbmyrlvḻḷṟṉśṣsh'.split('').reverse();
const ordermap = new Map();
for(const [i,v] of order.entries()) {
    ordermap.set(v,i);
}

const tamilSort = (a,b,dir='asc') => {
    const minlen = Math.min(a.length,b.length);
    let n = 0;
    while(n < minlen) {
        const achar = a.charAt(n).toLowerCase();
        const bchar = b.charAt(n).toLowerCase();
        if(achar === bchar) {
            n++;
        } else {
            
            const aindex = ordermap.get(achar) || -1;
            const bindex = ordermap.get(bchar) || -1;
            return dir === 'asc' ? aindex < bindex : aindex > bindex;
            
            //return order.indexOf(achar) < order.indexOf(bchar);
        }
    }
    return dir === 'asc' ? a.length > b.length : a.length < b.length;
};
DataTable.ext.type.search.tamil = (a) => {
    return a ? cleanup(a) : '';
};
/*
DataTable.ext.type.order['tamil-pre'] = (a) => {
    return a ?
        a.replace(/<.*?>|\u00AD/g, '')
         .replace(/\s+/, ' ').toLowerCase() :
        '';
};
*/
const cleanup = (a) => {
    return a ?
        a.replace(/<.*?>|\u00AD/g, '')
         .trim()
         .replace(/\s+/, ' ').toLowerCase() :
        '';
};

DataTable.ext.type.order['tamil-asc'] = (a,b) => {
    return tamilSort(cleanup(a),cleanup(b),'asc');
};

DataTable.ext.type.order['tamil-desc'] = (a,b) => {
    return tamilSort(cleanup(a),cleanup(b),'desc');
};

DataTable.ext.type.order['shelfmark-pre'] = (a) => {
    return a ? a.replace(/\d+/g,((match) => {
        return match.padStart(4,'0');
    })) : '0000';
};

DataTable.ext.type.order['extent-pre'] = (a) => {
    if(a.match(/^\d+ f?f.$/)) return parseInt(a) * 2;
    else return parseInt(a);
};

DataTable.ext.type.order['numrange-pre'] = (a) => {
    if(a.match('–')) {
        const split = a.split('–');
        return split[0] || split[1];
    }
    else return a;
};
DataTable.ext.type.order['hyphenated-pre'] = (a) => {
    return a ?
        a.replace(/<.*?>|\u00AD/g, '')
         .replace(/\s+/g, ' ')
         .toLowerCase() :
        '';
};
DataTable.ext.type.search.hyphenated = (a) => {
    return a ?
        a.replace(/<.*?>|\u00AD/g, '')
        .replace(/\s+/g, ' ')
        .toLowerCase() :
        '';
};

