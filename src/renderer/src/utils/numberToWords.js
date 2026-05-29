export function numberToWords(number) {
  const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
  const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const tens = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingts', 'quatre-vingt-dix'];

  function convertGroup(n) {
    if (n === 0) return '';
    let words = '';
    
    // Hundreds
    if (n >= 100) {
      const h = Math.floor(n / 100);
      if (h === 1) words += 'cent ';
      else words += units[h] + ' cents ';
      n %= 100;
    }
    
    // Tens & Units
    if (n > 0) {
      if (n < 10) {
        words += units[n] + ' ';
      } else if (n < 20) {
        words += teens[n - 10] + ' ';
      } else {
        const t = Math.floor(n / 10);
        const u = n % 10;
        
        if (t === 7) {
          words += 'soixante-' + (u === 1 ? 'et-onze ' : teens[u] + ' ');
        } else if (t === 9) {
          words += 'quatre-vingt-' + teens[u] + ' ';
        } else if (t === 8) {
          words += (u === 0 ? 'quatre-vingts ' : 'quatre-vingt-' + units[u] + ' ');
        } else {
          words += tens[t] + (u === 1 ? ' et un ' : (u > 0 ? '-' + units[u] + ' ' : ' '));
        }
      }
    }
    return words.trim();
  }

  function convertPart(n) {
    if (n === 0) return 'zéro';
    let words = '';
    
    const billions = Math.floor(n / 1000000000);
    n %= 1000000000;
    const millions = Math.floor(n / 1000000);
    n %= 1000000;
    const thousands = Math.floor(n / 1000);
    n %= 1000;
    const unitsGroup = n;

    if (billions > 0) {
      words += convertGroup(billions) + (billions > 1 ? ' milliards ' : ' milliard ');
    }
    if (millions > 0) {
      words += convertGroup(millions) + (millions > 1 ? ' millions ' : ' million ');
    }
    if (thousands > 0) {
      if (thousands === 1) words += 'mille ';
      else words += convertGroup(thousands) + ' mille ';
    }
    if (unitsGroup > 0) {
      words += convertGroup(unitsGroup);
    }
    
    return words.trim();
  }

  // Split into Dinars and Millimes
  const parts = Number(number).toFixed(3).split('.');
  const dinars = parseInt(parts[0], 10);
  const millimes = parseInt(parts[1], 10);

  let result = '';
  
  if (dinars === 0) {
    result = 'Zéro dinar';
  } else {
    result = convertPart(dinars) + (dinars > 1 ? ' dinars' : ' dinar');
    result = result.charAt(0).toUpperCase() + result.slice(1);
  }

  if (millimes > 0) {
    result += ' et ' + convertPart(millimes) + ' millimes';
  }

  return result;
}
