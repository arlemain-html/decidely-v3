import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useReadContract, useWriteContract, useAccount, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { useState, useEffect } from 'react';

const CONTRACT_ADDRESS = "0x43d2943a120926c4e47b69abf59b0bb5580adbab";
const ABI = [
  {"inputs":[{"internalType":"string","name":"_content","type":"string"},{"internalType":"string","name":"_category","type":"string"}],"name":"createPost","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"_index","type":"uint256"},{"internalType":"string","name":"_newContent","type":"string"}],"name":"editPost","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"_index","type":"uint256"}],"name":"deletePost","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"_postIndex","type":"uint256"},{"internalType":"string","name":"_text","type":"string"}],"name":"addComment","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"_postIndex","type":"uint256"},{"internalType":"uint256","name":"_commentIndex","type":"uint256"},{"internalType":"bool","name":"_upvote","type":"bool"}],"name":"voteComment","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"_postIndex","type":"uint256"},{"internalType":"uint256","name":"_commentIndex","type":"uint256"}],"name":"tipComment","outputs":[],"stateMutability":"payable","type":"function"},
  {"inputs":[],"name":"getTotalPosts","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"posts","outputs":[{"internalType":"address","name":"author","type":"address"},{"internalType":"string","name":"content","type":"string"},{"internalType":"string","name":"category","type":"string"},{"internalType":"bool","name":"isDeleted","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"_postIndex","type":"uint256"}],"name":"getComments","outputs":[{"components":[{"internalType":"address","name":"author","type":"address"},{"internalType":"string","name":"text","type":"string"},{"internalType":"int256","name":"votes","type":"int256"},{"internalType":"bool","name":"isDeleted","type":"bool"}],"internalType":"struct decidelyV3.Comment[]","name":"","type":"tuple[]"}],"stateMutability":"view","type":"function"}
];

function CommentSection({ postIndex }) {
  const [text, setText] = useState("");
  const { writeContract, data: hash } = useWriteContract();
  const { data: comments, refetch } = useReadContract({ address: CONTRACT_ADDRESS, abi: ABI, functionName: 'getComments', args: [BigInt(postIndex)] });
  const { isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess) {
      const timer = setInterval(() => refetch(), 1000);
      setTimeout(() => clearInterval(timer), 3000);
    }
  }, [isSuccess]);

  return (
    <div className="mt-6 space-y-4 border-t border-white/5 pt-6">
      {comments?.filter(c => !c.isDeleted).map((c, i) => (
        <div key={i} className="bg-white/[0.03] p-4 rounded-xl border border-white/5">
          <p className="text-gray-300 text-sm mb-3">{c.text}</p>
          <div className="flex justify-between items-center text-[9px] uppercase tracking-widest text-gray-500 font-bold">
            <span>{c.author.slice(0,6)}...{c.author.slice(-4)}</span>
            <div className="flex items-center gap-4">
              <span className="text-cyan-500">{Number(c.votes)} VOTES</span>
              <button onClick={() => writeContract({ address: CONTRACT_ADDRESS, abi: ABI, functionName: 'voteComment', args: [BigInt(postIndex), BigInt(i), true]})} className="hover:text-cyan-400 transition-colors">▲</button>
              <button onClick={() => writeContract({ address: CONTRACT_ADDRESS, abi: ABI, functionName: 'tipComment', args: [BigInt(postIndex), BigInt(i)], value: parseEther("0.0001")})} className="bg-cyan-500 text-black px-2 py-0.5 rounded shadow-[0_0_10px_rgba(6,182,212,0.5)] font-black">TIP ETH</button>
            </div>
          </div>
        </div>
      ))}
      <div className="flex gap-2 mt-4">
        <input value={text} onChange={e => setText(e.target.value)} placeholder="Provide advice..." className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-cyan-500/50" />
        <button onClick={() => { writeContract({ address: CONTRACT_ADDRESS, abi: ABI, functionName: 'addComment', args: [BigInt(postIndex), text]}); setText(""); }} className="bg-white/10 hover:bg-white/20 px-6 rounded-xl text-xs font-bold uppercase tracking-widest transition-all">Reply</button>
      </div>
    </div>
  );
}

function PostItem({ index, refreshFeed }) {
  const { address } = useAccount();
  const { writeContract, data: hash } = useWriteContract();
  const { data: post, refetch } = useReadContract({ address: CONTRACT_ADDRESS, abi: ABI, functionName: 'posts', args: [BigInt(index)] });
  const { isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess) {
      const timer = setInterval(() => { refetch(); refreshFeed(); }, 1000);
      setTimeout(() => clearInterval(timer), 3000);
    }
  }, [isSuccess]);

  if (!post || post[3]) return null;
  const isOwner = address?.toLowerCase() === post[0].toLowerCase();

  return (
    <div className="bg-[#111111] border border-white/5 p-8 rounded-[2rem] transition-all hover:bg-[#141414]">
      <div className="flex justify-between items-start mb-6">
        <span className="bg-cyan-500/10 text-cyan-400 text-[10px] px-4 py-1 rounded-full font-black uppercase tracking-widest border border-cyan-500/20">{post[2] || 'General'}</span>
        {isOwner && (
          <div className="flex gap-3 text-[10px] font-bold text-gray-600 uppercase">
            <button className="hover:text-white transition-colors">Edit</button>
            <button onClick={() => writeContract({ address: CONTRACT_ADDRESS, abi: ABI, functionName: 'deletePost', args: [BigInt(index)]})} className="hover:text-red-500 transition-colors">Delete</button>
          </div>
        )}
      </div>
      <h3 className="text-2xl font-bold text-white mb-2 leading-snug">{post[1]}</h3>
      <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mb-6">By: {post[0]}</p>
      <CommentSection postIndex={index} />
    </div>
  );
}

export default function App() {
  const [content, setContent] = useState("");
  const [cat, setCat] = useState("Crypto");
  const { writeContract, data: hash } = useWriteContract();
  const { data: total, refetch } = useReadContract({ address: CONTRACT_ADDRESS, abi: ABI, functionName: 'getTotalPosts' });
  const { isSuccess, isLoading } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess) {
      setContent("");
      const timer = setInterval(() => refetch(), 1000);
      setTimeout(() => clearInterval(timer), 3000);
    }
  }, [isSuccess]);

  const indices = total ? Array.from(Array(Number(total)).keys()).reverse() : [];

  return (
    <div className="min-h-screen bg-[#030303] text-white font-sans selection:bg-cyan-500 selection:text-black">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <header className="flex justify-between items-center mb-20">
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter uppercase">Decidely <span className="text-cyan-500 not-italic">V3</span></h1>
            <p className="text-[10px] text-gray-600 tracking-[0.3em] font-bold uppercase mt-1">Decentralized Advice Protocol</p>
          </div>
          <ConnectButton chainStatus="none" showBalance={false} />
        </header>

        <section className="mb-24 bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-8">
          <div className="flex gap-3 mb-8">
            {['Crypto', 'Tech', 'Life', 'Gaming'].map(t => (
              <button key={t} onClick={() => setCat(t)} className={`text-[10px] px-5 py-2 rounded-full font-black uppercase tracking-widest transition-all ${cat === t ? 'bg-white text-black' : 'bg-white/5 text-gray-500'}`}>{t}</button>
            ))}
          </div>
          <textarea 
            value={content} onChange={e => setContent(e.target.value)}
            placeholder="Ask the world, should you...?"
            className="w-full h-32 bg-transparent text-2xl font-bold focus:outline-none placeholder:text-gray-800 resize-none mb-8"
          />
          <button 
            disabled={isLoading}
            onClick={() => writeContract({ address: CONTRACT_ADDRESS, abi: ABI, functionName: 'createPost', args: [content, cat]})}
            className="w-full bg-cyan-500 text-black font-black py-5 rounded-2xl transition-all hover:scale-[1.01] shadow-[0_0_30px_rgba(6,182,212,0.3)] text-sm uppercase tracking-[0.25em]"
          >
            {isLoading ? "Broadcasting..." : "Publish Question"}
          </button>
        </section>

        <div className="flex items-center gap-4 mb-12">
          <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-cyan-500/50">Live Feed</h2>
          <div className="h-px flex-1 bg-gradient-to-r from-cyan-500/20 to-transparent" />
        </div>

        <div className="space-y-12">
          {indices.map(idx => <PostItem key={idx} index={idx} refreshFeed={refetch} />)}
        </div>
      </div>
    </div>
  );
}