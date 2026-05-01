#!/bin/bash
source ~/openzess_venv/bin/activate
export DISPLAY=:100
python3 -c "
import mss
try:
    s = mss.mss()
    print('Monitors:', s.monitors)
    img = s.grab(s.monitors[0])
    print('SUCCESS! Grabbed screen:', img.size)
except Exception as e:
    print('FAILED:', e)
"
