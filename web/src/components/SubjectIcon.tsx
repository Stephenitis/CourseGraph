import { Atom, Binary, Bot, Brain, ChartColumn, CircuitBoard, Code2, Database, Eye, Network, Sigma } from 'lucide-react';
export default function SubjectIcon({title}:{title:string}){
  const text=title.toLowerCase();
  const Icon=/vision|visual|image/.test(text)?Eye:/robot|autonomous/.test(text)?Bot:/learning|intelligence|neural|inference/.test(text)?Brain:/probability|statistics|data analysis|optimization/.test(text)?ChartColumn:/database/.test(text)?Database:/network|distributed/.test(text)?Network:/circuit|electronic|hardware|computation structures/.test(text)?CircuitBoard:/physics|mechanic|electromagnet|quantum/.test(text)?Atom:/math|calculus|algebra|geometry|differential|analysis|topology/.test(text)?Sigma:/program|software|computer|algorithm/.test(text)?Code2:Binary;
  return <Icon size={16} strokeWidth={1.7} className="subject-icon" aria-hidden="true"/>;
}
