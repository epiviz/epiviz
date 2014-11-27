import jinja2

loader = jinja2.FileSystemLoader(searchpath=".")
env = jinja2.Environment(loader=loader)
template = env.get_template("_index-standalone.html")
out = template.render()

with open('index-standalone.html', 'w') as f:
    f.write(out)


