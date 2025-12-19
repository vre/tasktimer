    // ============================================
    // PURE FUNCTIONS (testable, no side effects)
    // ============================================
    var darkenCache = {};
    var ClockLogic = {
      darken: function(hex, factor) {
        var key = hex + factor;
        if (darkenCache[key]) return darkenCache[key];
        var r = Math.floor(parseInt(hex.substr(1, 2), 16) * factor);
        var g = Math.floor(parseInt(hex.substr(3, 2), 16) * factor);
        var b = Math.floor(parseInt(hex.substr(5, 2), 16) * factor);
        var result = '#' + r.toString(16).padStart(2, '0') + g.toString(16).padStart(2, '0') + b.toString(16).padStart(2, '0');
        darkenCache[key] = result;
        return result;
      },

      parseInput: function(input, mode, now, maxMinutes) {
        // Reject empty or excessively long input
        if (!input || input.length > 20) return null;

        if (mode === 'end') {
          if (input.includes(':')) {
            // Validate hh:mm format - require digits on both sides of colon
            if (!/^\d{1,2}:\d{1,2}$/.test(input)) return null;
            var parts = input.split(':').map(Number);
            var h = parts[0];
            var m = parts[1];
            if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;

            var target = new Date(now);
            target.setHours(h, m, 0, 0);
            if (target <= now) {
              target.setDate(target.getDate() + 1);
            }

            var total = Math.min(Math.ceil((target - now) / 60000), maxMinutes);
            return { total: total, endTime: m };
          }

          var num = parseInt(input, 10);
          if (isNaN(num) || num < 0) return null;

          if (input.length >= 3 && input.length <= 4) {
            var h = Math.floor(num / 100);
            var m = num % 100;
            if (h < 0 || h > 23 || m < 0 || m > 59) return null;

            if (h < 12) {
              var amTarget = new Date(now);
              amTarget.setHours(h, m, 0, 0);
              if (amTarget <= now) amTarget.setDate(amTarget.getDate() + 1);

              var pmTarget = new Date(now);
              pmTarget.setHours(h + 12, m, 0, 0);
              if (pmTarget <= now) pmTarget.setDate(pmTarget.getDate() + 1);

              var amMins = Math.ceil((amTarget - now) / 60000);
              var pmMins = Math.ceil((pmTarget - now) / 60000);

              var amValid = amMins <= maxMinutes;
              var pmValid = pmMins <= maxMinutes;

              if (amValid && pmValid) {
                if (amMins <= pmMins) {
                  return { total: Math.min(amMins, maxMinutes), endTime: m };
                } else {
                  return { total: Math.min(pmMins, maxMinutes), endTime: m };
                }
              } else if (amValid) {
                return { total: Math.min(amMins, maxMinutes), endTime: m };
              } else if (pmValid) {
                return { total: Math.min(pmMins, maxMinutes), endTime: m };
              } else {
                if (amMins <= pmMins) {
                  return { total: Math.min(amMins, maxMinutes), endTime: m };
                } else {
                  return { total: Math.min(pmMins, maxMinutes), endTime: m };
                }
              }
            }

            var target = new Date(now);
            target.setHours(h, m, 0, 0);
            if (target <= now) {
              target.setDate(target.getDate() + 1);
            }

            var total = Math.min(Math.ceil((target - now) / 60000), maxMinutes);
            return { total: total, endTime: m };
          }

          if (num < 0 || num >= 60) return null;

          var target = new Date(now);
          target.setMinutes(num, 0, 0);
          if (target <= now) {
            target.setHours(target.getHours() + 1);
          }

          var total = Math.min(Math.ceil((target - now) / 60000), maxMinutes);
          return { total: total, endTime: num };
        }

        var mins = parseFloat(input);
        if (isNaN(mins) || mins <= 0) return null;
        return { total: Math.min(mins, maxMinutes), endTime: null };
      },

      getCircles: function(time, radius) {
        if (time > 120) {
          var outerT = time % 60 || 60;
          return [
            { r: radius.FULL, t: outerT, full: outerT === 60 },
            { r: radius.MIDDLE, t: 60, full: true },
            { r: radius.INNER, t: 60, full: true }
          ];
        }
        if (time > 60) {
          var outerT = time % 60 || 60;
          return [
            { r: radius.FULL, t: outerT, full: outerT === 60 },
            { r: radius.MIDDLE, t: 60, full: true }
          ];
        }
        if (time > 0) {
          return [{ r: radius.FULL, t: time, full: time === 60 }];
        }
        return [];
      },

      getLabelPosition: function(minute, mode, center, labelRadius) {
        var positionMinute = minute % 60;
        if (mode === 'cw') {
          positionMinute = (60 - positionMinute) % 60;
        }
        var angle = (positionMinute / 60) * 360 - 90;
        var rad = angle * Math.PI / 180;
        return {
          x: center + labelRadius * Math.cos(rad),
          y: center + labelRadius * Math.sin(rad)
        };
      },

      getCookie: function(name) {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
          var cookie = cookies[i].trim();
          if (cookie.indexOf(name + '=') === 0) {
            try {
              return decodeURIComponent(cookie.substring(name.length + 1));
            } catch (e) {
              return null;
            }
          }
        }
        return null;
      },

      setCookie: function(name, value, days) {
        // Validate cookie name (alphanumeric, underscore, hyphen only)
        if (!/^[a-zA-Z0-9_-]+$/.test(name)) return;
        var sanitizedValue = encodeURIComponent(String(value));
        // Reject values over 4000 chars to stay within 4KB cookie limit
        if (sanitizedValue.length > 4000) return;
        var expires = '';
        if (days) {
          var date = new Date();
          date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
          expires = '; expires=' + date.toUTCString();
        }
        document.cookie = name + '=' + sanitizedValue + expires + '; path=/; SameSite=Lax';
      },

      parseHash: function() {
        var hash = window.location.hash.substring(1);
        var params = {};
        var allowedParams = ['color', 'mode', 'marks', 'dark', 'sound', 'time', 'display'];
        if (hash) {
          hash.split('&').forEach(function(pair) {
            var parts = pair.split('=');
            if (parts.length === 2 && allowedParams.indexOf(parts[0]) !== -1) {
              params[parts[0]] = decodeURIComponent(parts[1]);
            }
          });
        }
        return params;
      },

      updateHash: function(state) {
        var params = [];
        if (state.color && state.color !== '#ff6b35') {
          params.push('color=' + state.color.substring(1));
        }
        if (state.mode && state.mode !== 'ccw') {
          params.push('mode=' + state.mode);
        }
        if (state.marks !== undefined && state.marks !== 15) {
          params.push('marks=' + state.marks);
        }
        if (document.body.classList.contains('dark')) {
          params.push('dark=1');
        }
        if (state.sound === true) {
          params.push('sound=on');
        }
        if (state.displayMode === 'digital') {
          params.push('display=digital');
        }
        if (state.timeValue) {
          params.push('time=' + encodeURIComponent(state.timeValue));
        }
        var hash = params.length > 0 ? '#' + params.join('&') : '';
        history.replaceState(null, '', window.location.pathname + hash);
      },

      // Generate a WAV beep as base64 data URI (works better in background than Web Audio API)
      generateBeepDataUri: function() {
        var sampleRate = 44100;
        var duration = 0.75;
        var frequency1 = 220; // A3
        var frequency2 = 277; // C#4
        var numSamples = Math.floor(sampleRate * duration);

        // WAV header
        var buffer = new ArrayBuffer(44 + numSamples * 2);
        var view = new DataView(buffer);

        // RIFF header
        var writeString = function(offset, str) {
          for (var i = 0; i < str.length; i++) {
            view.setUint8(offset + i, str.charCodeAt(i));
          }
        };
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + numSamples * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true); // chunk size
        view.setUint16(20, 1, true); // PCM
        view.setUint16(22, 1, true); // mono
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true); // byte rate
        view.setUint16(32, 2, true); // block align
        view.setUint16(34, 16, true); // bits per sample
        writeString(36, 'data');
        view.setUint32(40, numSamples * 2, true);

        // Generate samples with envelope
        for (var i = 0; i < numSamples; i++) {
          var t = i / sampleRate;
          // ADSR envelope
          var env;
          if (t < 0.04) env = t / 0.04; // attack
          else if (t < 0.6) env = 1.0; // sustain
          else env = Math.max(0, 1 - (t - 0.6) / 0.15); // release

          // Two sine waves mixed
          var sample = Math.sin(2 * Math.PI * frequency1 * t) * 0.3 +
                       Math.sin(2 * Math.PI * frequency2 * t) * 0.15;
          sample *= env;

          // Convert to 16-bit PCM
          var pcm = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)));
          view.setInt16(44 + i * 2, pcm, true);
        }

        // Convert to base64
        var binary = '';
        var bytes = new Uint8Array(buffer);
        for (var i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        return 'data:audio/wav;base64,' + btoa(binary);
      },

      // Cached beep data URI
      beepDataUri: null,

      // Play alarm using HTML5 Audio element (better background support than Web Audio API)
      playAlarm: function(state) {
        if (!state.sound) return null;

        var handle = { audios: [], timeout: null, notifications: [], retryTimeout: null };
        var self = this;

        // Build absolute icon URL for reliability
        var iconUrl = window.location.href.replace(/[^/]*$/, '') + 'icons/icon-192.png';

        // Show system notification for background tabs
        function showNotification(tag, body) {
          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              var notif = new Notification('Timer Complete', {
                body: body,
                icon: iconUrl,
                tag: tag,
                requireInteraction: true,
                silent: false
              });
              handle.notifications.push(notif);
              return notif;
            } catch (e) {}
          }
          return null;
        }

        showNotification('tasktimer-alarm', 'Your timer has finished!');

        // Retry notification after 3 seconds if document still hidden
        handle.retryTimeout = setTimeout(function() {
          if (document.hidden) {
            showNotification('tasktimer-alarm-retry', 'Timer waiting - click to view');
          }
        }, 3000);

        // Set dock badge (works on macOS PWA)
        if ('setAppBadge' in navigator) {
          navigator.setAppBadge(1).catch(function() {});
        }

        // Vibrate on mobile (pattern matches beep timing: 750ms on, 375ms off, repeat 3x)
        if ('vibrate' in navigator) {
          navigator.vibrate([750, 375, 750, 375, 750]);
        }

        // Generate beep sound (cached)
        if (!this.beepDataUri) {
          this.beepDataUri = this.generateBeepDataUri();
        }

        // Play 3 beeps using Audio elements
        var beepCount = 0;
        var playBeep = function() {
          if (beepCount >= 3) return;
          var audio = new Audio(self.beepDataUri);
          audio.volume = 1.0;
          handle.audios.push(audio);
          audio.play().catch(function() {});
          beepCount++;
          if (beepCount < 3) {
            handle.timeout = setTimeout(playBeep, 1125);
          }
        };

        playBeep();
        return handle;
      },

      stopAlarm: function(alarmHandle) {
        if (alarmHandle) {
          if (alarmHandle.timeout) clearTimeout(alarmHandle.timeout);
          if (alarmHandle.retryTimeout) clearTimeout(alarmHandle.retryTimeout);
          if (alarmHandle.audios) {
            alarmHandle.audios.forEach(function(a) { a.pause(); });
          }
          if (alarmHandle.notifications) {
            alarmHandle.notifications.forEach(function(n) { n.close(); });
          }
          // Clear dock badge
          if ('clearAppBadge' in navigator) {
            navigator.clearAppBadge().catch(function() {});
          }
        }
      },

      // Request notification permission (only once per session)
      notificationRequested: false,
      requestNotificationPermission: function() {
        if (this.notificationRequested) return;
        if ('Notification' in window && Notification.permission === 'default') {
          this.notificationRequested = true;
          Notification.requestPermission();
        }
      },

      // Wake Lock API - keeps screen on while timer runs
      wakeLock: null,

      requestWakeLock: async function() {
        if ('wakeLock' in navigator) {
          // Release existing lock first to prevent listener accumulation
          if (this.wakeLock) {
            try {
              this.wakeLock.release();
            } catch (e) {}
            this.wakeLock = null;
          }
          try {
            this.wakeLock = await navigator.wakeLock.request('screen');
            // Handle automatic release by browser (e.g., tab hidden, low battery)
            var self = this;
            this.wakeLock.addEventListener('release', function() {
              self.wakeLock = null;
            }, { once: true }); // Use once: true to auto-remove listener
          } catch (e) {
            // Wake lock request failed (e.g., low battery, tab not visible)
            this.wakeLock = null;
          }
        }
      },

      releaseWakeLock: function() {
        if (this.wakeLock) {
          this.wakeLock.release();
          this.wakeLock = null;
        }
      },

      // Canvas rendering - pure functions for angle calculations
      getTimerEndAngle: function(timerCircle, mode, endTime, now) {
        if (mode === 'end') {
          var curMin = now.getMinutes() + now.getSeconds() / 60;
          return (curMin / 60) * 360 - 90;
        }
        if (mode === 'cw') {
          return ((60 - timerCircle.t) / 60) * 360 - 90;
        }
        return (timerCircle.t / 60) * 360 - 90;
      },

      getWedgeAngles: function(circle, timerEnd, mode, endTime, now) {
        if (circle.full) {
          return { start: timerEnd, end: timerEnd + 360 };
        }
        if (mode === 'end') {
          var curMin = now.getMinutes() + now.getSeconds() / 60;
          var start = (curMin / 60) * 360 - 90;
          var end = (endTime / 60) * 360 - 90;
          if (end < start) end += 360;
          return { start: start, end: end };
        }
        if (mode === 'cw') {
          return { start: ((60 - circle.t) / 60) * 360 - 90, end: -90 };
        }
        return { start: -90, end: (circle.t / 60) * 360 - 90 };
      },

      // Render wedges to canvas context
      renderWedgesToCanvas: function(ctx, width, height, circles, mode, color, running, displayMode, endTime, now, center) {
        var self = this;
        ctx.clearRect(0, 0, width, height);
        if (circles.length === 0) return;

        var timerEnd = this.getTimerEndAngle(circles[0], mode, endTime, now);
        var opacity = running ? 1 : 0.2;
        var numCircles = circles.length;
        var RING_ZONE_WIDTH = 60;
        var RING_GAP = 2;
        var RING_ZONE_OUTER = 180;
        var DARKEN = { MIDDLE: 0.7, INNER: 0.5 };
        var RADIUS = { INNER: 60 };

        var ringWidth = displayMode === 'digital'
          ? (RING_ZONE_WIDTH - (numCircles - 1) * RING_GAP) / numCircles
          : undefined;

        for (var i = 0; i < circles.length; i++) {
          var c = circles[i];
          var radius = c.r;

          // Digital mode: override radius to fit in outer 1/3 zone
          if (displayMode === 'digital') {
            radius = RING_ZONE_OUTER - i * (ringWidth + RING_GAP);
          }

          var angles = this.getWedgeAngles(c, timerEnd, mode, endTime, now);
          var colorFactor = displayMode === 'digital'
            ? (i === 0 ? 0.85 : (i === 1 ? DARKEN.MIDDLE : DARKEN.INNER))
            : (c.r === RADIUS.INNER ? DARKEN.INNER : DARKEN.MIDDLE);
          var fillColor = c.full ? this.darken(color, colorFactor) : color;

          ctx.save();
          ctx.globalAlpha = opacity;
          ctx.fillStyle = fillColor;
          ctx.strokeStyle = fillColor;
          ctx.lineWidth = 2;

          var startRad = angles.start * Math.PI / 180;
          var endRad = angles.end * Math.PI / 180;
          var innerR = displayMode === 'digital' ? radius - ringWidth : 0;

          if (c.full) {
            // Full circle/donut
            ctx.beginPath();
            if (displayMode === 'digital') {
              // Donut shape
              ctx.arc(center, center, radius, 0, Math.PI * 2);
              ctx.arc(center, center, innerR, 0, Math.PI * 2, true);
            } else {
              // Full circle
              ctx.arc(center, center, radius, 0, Math.PI * 2);
            }
            ctx.fill();
            ctx.stroke();

            // Edge line
            ctx.beginPath();
            var edgeX = center + radius * Math.cos(startRad);
            var edgeY = center + radius * Math.sin(startRad);
            if (displayMode === 'digital') {
              ctx.moveTo(center + innerR * Math.cos(startRad), center + innerR * Math.sin(startRad));
            } else {
              ctx.moveTo(center, center);
            }
            ctx.lineTo(edgeX, edgeY);
            ctx.stroke();
          } else {
            // Partial wedge
            ctx.beginPath();
            if (displayMode === 'digital') {
              // Ring arc
              ctx.arc(center, center, radius, startRad, endRad);
              ctx.arc(center, center, innerR, endRad, startRad, true);
              ctx.closePath();
            } else {
              // Pie wedge
              ctx.moveTo(center, center);
              ctx.arc(center, center, radius, startRad, endRad);
              ctx.closePath();
            }
            ctx.fill();
            ctx.stroke();

            // Moving edge line
            var movingRad = mode === 'ccw' ? endRad : startRad;
            var movingX = center + radius * Math.cos(movingRad);
            var movingY = center + radius * Math.sin(movingRad);
            ctx.beginPath();
            ctx.strokeStyle = '#000';
            if (displayMode === 'digital') {
              ctx.moveTo(center + innerR * Math.cos(movingRad), center + innerR * Math.sin(movingRad));
            } else {
              ctx.moveTo(center, center);
            }
            ctx.lineTo(movingX, movingY);
            ctx.stroke();
          }
          ctx.restore();
        }
      }
    };

    // Expose for testing
    if (typeof window !== 'undefined') {
      window.ClockLogic = ClockLogic;
    }
