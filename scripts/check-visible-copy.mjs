import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const roots=["app","mobile/app","mobile/components"];
const ignored=["app/api"];
const visibleAttrs=new Set(["placeholder","aria-label","alt","title"]);
const forbidden=[
  "home","progress","coach","athlete","community","settings","membership","history","ready","open","today","private",
  "badges","challenge","leaderboard","share","referral","score","profile","access","available","blocks","template",
  "weekly","report","recovery","fuel","lifestyle","back","free","live","reset","join","found","camera","permission",
  "data","complete","build","your","voice","message","workout","exercise","body","current","weight","waist","photos",
  "performance","twin","level","health","wearable","morning","brief","daily","scan","start","finish","save","next",
  "current","status","sync","connected","offline","online"
];

const files=[];
function walk(dir){
  if(!fs.existsSync(dir))return;
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const full=path.join(dir,entry.name).replaceAll("\\","/");
    if(ignored.some(x=>full===x||full.startsWith(x+"/")))continue;
    if(entry.isDirectory())walk(full);
    else if(/\.(tsx|jsx)$/.test(entry.name))files.push(full);
  }
}
for(const root of roots)walk(root);

const errors=[];
function line(sf,node){return sf.getLineAndCharacterOfPosition(node.getStart(sf)).line+1}
function checkText(file,text,pos){
  const value=String(text).replace(/\s+/g," ").trim();
  if(!value)return;
  if(/[-\u2010-\u2015]/.test(value))errors.push(`${file}:${pos} enthält einen Strich im sichtbaren Text: ${JSON.stringify(value)}`);
  const lower=value.toLowerCase();
  for(const word of forbidden){
    const escaped=word.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
    const re=new RegExp(`(^|[^a-zäöüß])${escaped}([^a-zäöüß]|$)`,"i");
    if(re.test(lower)&&!/^be different$/i.test(value)){
      errors.push(`${file}:${pos} enthält englischen sichtbaren Text „${word}“: ${JSON.stringify(value)}`);
      break;
    }
  }
}

function visibleExpression(file,sf,node){
  if(!node)return;
  if(ts.isStringLiteral(node)||ts.isNoSubstitutionTemplateLiteral(node)){checkText(file,node.text,line(sf,node));return}
  if(ts.isTemplateExpression(node)){
    checkText(file,node.head.text,line(sf,node.head));
    for(const span of node.templateSpans)checkText(file,span.literal.text,line(sf,span.literal));
    return;
  }
  if(ts.isConditionalExpression(node)){
    visibleExpression(file,sf,node.whenTrue);
    visibleExpression(file,sf,node.whenFalse);
    return;
  }
  if(ts.isBinaryExpression(node)&&node.operatorToken.kind===ts.SyntaxKind.PlusToken){
    visibleExpression(file,sf,node.left);visibleExpression(file,sf,node.right);return;
  }
  if(ts.isParenthesizedExpression(node)){visibleExpression(file,sf,node.expression);return}
  if(ts.isArrayLiteralExpression(node)){for(const x of node.elements)visibleExpression(file,sf,x);return}
}

for(const file of files){
  const source=fs.readFileSync(file,"utf8");
  const sf=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);

  function visit(node){
    if(ts.isJsxText(node))checkText(file,node.getText(sf),line(sf,node));

    if(ts.isJsxAttribute(node)){
      const name=node.name.getText(sf);
      if(visibleAttrs.has(name)&&node.initializer){
        if(ts.isStringLiteral(node.initializer))checkText(file,node.initializer.text,line(sf,node.initializer));
        else if(ts.isJsxExpression(node.initializer))visibleExpression(file,sf,node.initializer.expression);
      }
      return;
    }

    if(ts.isJsxExpression(node)){visibleExpression(file,sf,node.expression);return}
    ts.forEachChild(node,visit);
  }
  visit(sf);
}

if(errors.length){
  console.error("Sichtbare Texte entsprechen nicht der deutschen Copy Regel:");
  for(const error of errors.slice(0,180))console.error("  "+error);
  if(errors.length>180)console.error(`  und ${errors.length-180} weitere`);
  process.exit(1);
}
console.log(`Copy Prüfung erfolgreich für ${files.length} Oberflächen Dateien.`);
