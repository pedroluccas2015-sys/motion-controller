export function features(p,w){
 if(!p||![11,12,23,24,25,26,27,28].every(i=>p[i]&&p[i].visibility>.6))return null;
 const hip={x:(p[23].x+p[24].x)/2,y:(p[23].y+p[24].y)/2};
 const shoulder=(p[11].y+p[12].y)/2,scale=hip.y-shoulder;
 if(scale<.07||p[27].y>.98||p[28].y>.98)return null;
 return {x:hip.x,y:hip.y,scale,ly:(p[27].y-hip.y)/scale,ry:(p[28].y-hip.y)/scale,feet:(p[27].y+p[28].y)/2,lz:w?(w[27].z-w[23].z):0,rz:w?(w[28].z-w[24].z):0,arms:p[15]?.visibility>.6&&p[16]?.visibility>.6&&p[15].y<p[11].y&&p[16].y<p[12].y};
}
export function classify(f,b){if(!f||!b)return null;
 if((b.y-f.y)/b.scale>.22&&(b.feet-f.feet)/b.scale>.18)return 'jump';
 if(b.ly-f.ly>.45||b.ry-f.ry>.45||b.lz-f.lz>.25||b.rz-f.rz>.25)return 'kick';
 if((f.x-b.x)/b.scale>.5)return 'left';if((f.x-b.x)/b.scale<-.5)return 'right';
 if((f.y-b.y)/b.scale>.25)return 'down';if(f.arms)return 'action';return null;
}
