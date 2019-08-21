window.onload = function(){

const submit = document.querySelector("#submit");
const block = document.querySelector("#code");
const example = document.querySelector("#example");
const tidy = document.querySelector("#tidy");

let original = null;

function copyToClip(str) {
  function listener(e) {
    e.clipboardData.setData("text/html", str);
    e.clipboardData.setData("text/plain", str);
    e.preventDefault();
  }
  document.addEventListener("copy", listener);
  document.execCommand("copy");
  document.removeEventListener("copy", listener);
}

function replaceMultilineComments(text, starting) {
   const start1 = /\/\*/gm;
   const end1 = /\*\//gm;
   const start2 = /\u00AB/gm;
   const end2 = /\u00BB/gm;
  if(starting){
   text = text.replace(start1,'\u00AB');
   text = text.replace(end1, '\u00BB');
  } else {
   text = text.replace(start2,'\/\*');
   text = text.replace(end2, '\*\/');
  }
   return text;
}



function indent (text){
  // indent every line between curly brackets
  let lines = text.split("\n");
  let level = 0;
  for (let i=0;i<lines.length;i++){
      if(lines[i].startsWith("}")){
        level-=2;
        level = level >=0 ? level: 0;
      }
      if(lines[i].endsWith("{") && !(lines[i].trim().startsWith("\/\/"))){
        lines[i] = " ".repeat(level)+lines[i];
        level+=2;
      } else {
        lines[i] = " ".repeat(level)+lines[i];
      }
  }
  return lines.join("\n");
}

function clean(){
  const statements = /(?<!(for[\W\s]|\").*?)\;\s*(\S)/g;
  const commentscurlyopen = /(?<=\u00AB[^\u00BB]*?){/gm;
  const commentscurlyclose = /(?<=\u00AB[^\u00BB]*?)}/gm;
  const forloop = /(?<=for[\W\s].*)\;\s*(\S)/g;
  const forif = /(for|if|while)\s*\(/g;
  const tab = /^\s+(.*)/gm;
  const newline = /\n(\s*\n)+/gm;
  const curlyopen = /(?<!(\/\/|@\w+\s*\(|\u00AB[^\u00BB]*?))\s*{(\s*(?!\s*?\")(.+?))/g;
  const curlyclose = /(?<!(\/\/|@\w+\s*\(\s*\{[^}]*?|\u00AB[^\u00BB]*?))(\s*(\S*)}(?!\s*?\"))/g;
  const curlyclose2 = /(?<!(\/\/|\u00AB[^\u00BB]*?))}\s*}(?![\s}]*\")/g;
  const curlytight = /(?<!(\/\/|\u00AB[^\u00BB]*?))}([\w])/g;
  const text =  /(?<!(\/\/|\u00AB[^\u00BB]*?|@\w+\(|\w))(\".*?\")/g
  const text2 = /(?<!(\/\/|\u00AB[^\u00BB]*?|@\w+\(|\w))\[(\".*?\")\]/g
  const operators = /(?<!(\/\/.*?|\[\"[^\"]*?|\u00AB[^\u00BB]*?))\s*((?<=[\w\d]\s*)\-(?=\s*[\w\d])|\->|\+=|\-=|\*=|(?<![\/\.])\*(?!\/)|\/=|(?<!(\/|\*))\/(?!(\/|\*))|%=|%|&&|&|\|\||\||~|<=|<<|>>>|<(?!(>|\?|int|double|float|boolean|short|byte|long|[A-Z]))|>=|(?<!(int|boolean|short|byte|float|long|double|<|\[\]|[A-Z][a-z]*)>?)>|instanceof|==|!=|&=|\|=|=|~|(?<!\+)\+(?!\+)|(?<!:):(?!:)|(?<!<)\?)\s*/g;
  const commas = /\s*,\s*/g;
  let code = block.value.trim();
  code = replaceMultilineComments(code, true);
  code = code.replace(text, "[$2]");
  code = code.replace(statements, "\;\n$2");
  code = code.replace(forloop, "\; $1");
  code = code.replace(forif, "$1 \(");
  code = code.replace(operators," $2 ");
  code = code.replace(text2,"$2")
  code = code.replace(newline, "\n\n");
  code = code.replace(commas,", ");
  code = code.replace(tab, "$1");
  code = code.replace(curlyopen, " {\n$3");
  code = code.replace(curlyclose, "$3\n}");
  code = code.replace(curlyclose2, "}\n}");
  code = code.replace(curlytight, "} $2");
  code = indent(code);
  code = replaceMultilineComments(code, false);
  block.value=code;
}

function generate() {
  const submitLabel = document.querySelector("#submitLabel");
  const lt = /</g;
  const gt = />/g;
  const amp = /\&(?![\w\d]+;)/g;
  const keywordsmodule = /(?<=(?<!(\/\/.*|\[\"[^\"\n]*|[\u00AB][^\u00BB]*?|[a-zA-Z]))module[\s\S]*)(((requires|opens|exports|transitive|to|provides|with|open||uses)(\s+))+)/gm;
  const keywords = /(?<!(\/\/.*|(\[\"[^\"\n]*|\u00AB[^\u00BB]*?|[a-zA-Z])))(((new|super|(?<!(class|interface|enum|module)[^{]*{[^{]*)var|this|extends|implements|if|case|else|(?<=(switch|@interface)[^{]*{[^{]*)default|continue|break|null|true|false|switch|throws|do|for|import|instanceof|return|while|assert)(\s*))+)(?=\W)/gm;
  const errors = /(?<!(\/\/.*|\[\"[^\"\n]*|\u00AB[^\u00BB]*?|[a-zA-Z]))(((throw|finally|catch|try)(\s*))+)(?=\W\D)/gm;  
  const primitives = /(?<!(\/\/.*|\[\"[^\"]*|\u00AB[^\u00BB]*?|\w))(((void|boolean|double|int|short|byte|char|long|float))(?=[\s\]\)\[])+)/gm;
  const annotations = /(?<!(\/\/.*|\[\"[^\"]*|\u00AB[^\u00BB]*?|[a-zA-Z]))((@(Override|Test|Begin|Deprecated|SafeVarargs|Target|Retention|Documented|Repeatable|FunctionalInterface|SuppressWarnings|Ignore|SupportedAnnotationTypes|SupportedSourceVersion)(\(.*?\))?))/gm;
  const types = /(?<!(\/\/.*|\[\"[^\"\n]*|\u00AB[^\u00BB]*?|[a-zA-Z\.]))(((class|@?interface|enum|package|module)(?![\w]) ?)+)/gm;
  const modifiers = /(?<!(\/\/.*|\[\"[^\"]*|\u00AB[^\u00BB]*?|[a-zA-Z]))(((public|private|static|abstract|final|synchronized|(?<=[^@]interface[^{]*\{[^{]*)default|strictfp|protected|volatile|native) ?)+)(?!\w)/gm;
  const comments1 = /(\/\/.*)/g;
  const comments2 = /(\u00AB[^\*][^\u00BB]*?\u00BB)/gm;
  const documentation = /(\u00AB\*[^\u00BB]*?\u00BB)/gm;
  const javadoc = /(?<=\u00AB\*[^\u00BB]*?)(@(author|docRoot|version|since|see|param|return|exception|throws|deprecated|inheritDoc|linkplain|link|value|code|literal|serialData|serialField|serial))/gm;
  const text =  /(?<!(\/\/|\u00AB[^\u00BB]*?|@\w+\(|\w))(\".*?\")/g
  const text2 = /(?<!(\/\/|\u00AB[^\u00BB]*?|@\w+\(|\w))\[(\".*?\")\]/g
  const numbers = /(?<!(\/\/.*|\[\"[^\"\n]*|\u00AB[^\u00BB]*?|\w[\w\d_$]*))((0b|0)?[\d_]+(\.(\d+)*)?[LDFldf]?)/gm
  const hexnumbers = /(?<!(\/\/.*|\[\"[^\"]*|\u00AB[^\u00BB]*?|[g-zG-Z_]))((0x)[\d_a-fA-F]+[Ll]?)/gm
  const operators = /(?<!(\/\/.*|\[\"[^\"]*|\u00AB[^\u00BB]*?))(\+{1,2}|\-{1,2}|\+=|\-=|\*=|\|=|==|!=|(?<![\/\.])\*(?!\/)|\/=|(?<!(\/|\*))\/(?!(\/|\*))|%=|%|&&|&=|&|\|\||\||~|<<|>>|>>>|<=|<(?!(>|\?|int|double|float|boolean|short|byte|long|[A-Z]))|>=|(?<!(int|boolean|short|byte|float|long|double|<|\[\]|[A-Z][a-z]*)>?)>|instanceof|!+|=|~|:+|\?)/gm;
  const specialcharacters = /(?<!(\/\/.*|\u00AB[^\u00BB]*?|[a-zA-Z]))(?<=[\"\'][^\"\']*)(\\[tbnrf\\\"\'])(?=[^\'\"]*[\'\"])/g;
  const operators2 = /((#\[))(.*?)((\]#))/g;
  let code = block.value;
  original = code.slice();
  code = replaceMultilineComments(code,true);
  code = code.replace(text, "[$2]");
  code = code.replace(operators,"#[$2]#");
  code = code.replace(lt, "&lt;");
  code = code.replace(gt, "&gt;");
  code = code.replace(types, "<span class='types'>$3</span>");
  code = code.replace(annotations, "<span class='annotations'>$2</span>")
  code = code.replace(keywords, "<span class='keywords'>$3</span>");
  code = code.replace(keywordsmodule, "<span class='keywords'>$2</span>");
  code = code.replace(errors, "<span class='errors'>$2</span>");
  code = code.replace(modifiers, "<span class='modifiers'>$2</span>");
  code = code.replace(primitives, "<span class='primitives'>$4</span>");
  code = code.replace(hexnumbers, "<span class='numbers'>$3</span>");
  code = code.replace(numbers, "<span class='numbers'>$&</span>");
  code = code.replace(specialcharacters, "<span class='special'>$2</span>");
  code = code.replace(amp, "&amp;");
  code = code.replace(comments1, "<span class='comments'>$1</span> ");
  code = code.replace(comments2, "<span class='comments'>$&</span>");
  code = code.replace(documentation, "<span class='documentation'>$&</span>");
  code = code.replace(javadoc, "<span class='javadoc'>$&</span>");
  code = code.replace(text2, "<span class='strings'>$2</span>");
  code = code.replace(operators2,"<span class='operators'>$3</span>");
  code = replaceMultilineComments(code,false);

const newCode = `<!-- original code:
${original}
-->
<style>
.keywords,.types,.modifiers,.operators,.errors,.javadoc{
  font-weight:bold;
}
.keywords, .primitives {
   color: blue;
}
.types {
  color: darkblue;
}
.errors {
  color:darkred;
}
.modifiers{
  color: teal;
}
.comments {
  color: #00A500;
}
.strings { 
  color: darkviolet; 
}
.annotations, .documentation {
  color: gray;
}
.special {
  color:red;
}
.operators {
  color:navy;
}
.numbers {
  color: brown;  
}</style>
<code><pre>${code}</pre></code>`;
  example.innerHTML = newCode;
  block.value = newCode;
  block.select();
  document.execCommand("copy");
  block.value = original;
  submitLabel.textContent = "";
}
tidy.addEventListener("click",clean);
submit.addEventListener("click", generate);
example.addEventListener("click", function() {
  block.value = original;
  //copyToClip(example.innerHTML);
})
}
