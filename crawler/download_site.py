from pywebcopy import save_website
save_website(
    url="https://www.budsas.org/",
    project_folder="./savedpages/",
    project_name="budsas",
    bypass_robots=True,
    debug=True,
    open_in_browser=False,
    delay=0.2,
    threaded=True,
)

save_website(
    url="https://www.phaptru.com/",
    project_folder="./savedpages/",
    project_name="phaptru",
    bypass_robots=True,
    debug=True,
    open_in_browser=False,
    delay=0.2,
    threaded=True,
)