import jinja2

loader = jinja2.FileSystemLoader(searchpath=".")
env = jinja2.Environment(loader=loader)
template = env.get_template("_index.php")
out = template.render()

with open('index.php', 'w') as f:
    f.write(out)


