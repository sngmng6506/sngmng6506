"""Generate the README preview from the same graph data as the interactive page."""
import json,html
from pathlib import Path
root=Path(__file__).resolve().parents[1]
data=json.loads((root/'docs/activity-map/data.json').read_text())
colors={'person':'#e7d7b7','build':'#b7a077','write':'#7fa9ba','community':'#a28bbb','research':'#8eaa94'}
nodes={n['id']:n for n in data['nodes'] if n['level']==0}
def xy(n):return 580+n['x']*.45,245+n['y']*.38
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="520" viewBox="0 0 1100 520" role="img" aria-labelledby="title"><title id="title">Sangmyeong activity atlas — explore services, writing, community and research</title><rect width="1100" height="520" rx="14" fill="#111215"/><g font-family="Arial,sans-serif"><text x="35" y="42" fill="#d3bb8c" font-size="10" letter-spacing="3">SANGMYEONG / ACTIVITY ATLAS</text><text x="35" y="72" fill="#92949e" font-size="12">Build. Write. Connect.</text>']
for e in data['edges']:
 if e['source'] in nodes and e['target'] in nodes:
  a,b=xy(nodes[e['source']]),xy(nodes[e['target']]);out.append(f'<line x1="{a[0]}" y1="{a[1]}" x2="{b[0]}" y2="{b[1]}" stroke="#3d3e47"/>')
for n in nodes.values():
 x,y=xy(n);color=colors[n['group']];r=9 if n['id']=='me' else 5
 out.append(f'<circle cx="{x}" cy="{y}" r="{r+5}" fill="none" stroke="{color}" opacity=".25"/><circle cx="{x}" cy="{y}" r="{r}" fill="{color}"/><text x="{x}" y="{y+25}" text-anchor="middle" fill="#d0d1d9" font-size="12">{html.escape(n["label"])}</text>')
out.append('<line x1="35" y1="466" x2="1065" y2="466" stroke="#292a31"/><text x="35" y="494" fill="#9496a0" font-size="11">Services · Notes · Community · Research</text><text x="1065" y="494" text-anchor="end" fill="#d3bb8c" font-size="11">Explore the interactive map ↗</text></g></svg>')
(root/'docs/activity-map/preview.svg').write_text(''.join(out)+'\n')
