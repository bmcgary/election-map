Download the CSV and put it into public/elections. Edit it with LibreCalc
to make the columns match (more or less) what other elections look like.

In src/App.jsx 
	at top import the new election
	Run npm run build
	around line 298 add in the new elections file name (which is found 
		in build/static/media/
	save, and test locally. Should be able to see new election results

run npm build. and then npm deploy
prob wouldnt hurt to commit and push, but there is no pull request/
merging needed to get on site. It does take a few min to refresh cache
