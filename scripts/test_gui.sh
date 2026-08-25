#!/bin/bash
export DISPLAY=:100
python3 -c "
import tkinter as tk
r = tk.Tk()
r.geometry('600x400')
r.title('Matrix Status')
tk.Label(r, text='Matrix is working! The void is no longer empty.', font=('Arial', 18)).pack(expand=True)
r.mainloop()
" &
