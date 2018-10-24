# tmux-net-speed
Tmux plugin to monitor upload and download speed of one or all interfaces.

## Usage
Add one of the following format string to `status-right` tmux option.

## Special Credit
This plugin is roughly based on the various plugins in [https://github.com/tmux-plugins]("tmux-plugins").

## Formats
Shows value in either MB/s, KB/s, or B/s.

- `#{download_speed}` - Shows only download speed,
- `#{upload_speed}` - Shows only upload speed,
- `#{net_speed}` - Shows both the upload and download speeds.
    **Example**: "D: 123 MB/s U: 25 MB/s"

## Past Values
Since this is a difference, the old values are stored in files in `/tmp/`. The user must be able to
read and write to this directory.

### Set Options

Set the following options in your `.tmux.conf`.

To change which interfaces to pull from, use a space-separated list. If not set,
grabs all the interfaces listed in "/sys/class/net/"

```
set -g @net_speed_interfaces "eth0 eth1"
```

To change the formatter sting passed to `printf`.

```
set -g @download_speed_format "%10s"
set -g @upload_speed_format "%10s"
set -g @net_speed_format "D:%10s U:%10s"
```

### Installation with [Tmux Plugin Manager](https://github.com/tmux-plugins/tpm) (recommended)

Add plugin to the list of TPM plugins in `.tmux.conf`:

    set -g @plugin 'tmux-plugins/tmux-net-speed'

Hit `prefix + I` to fetch the plugin and source it.

If format strings are added to `status-right`, they should now be visible.

### Manual Installation

Clone the repo:

    $ git clone https://github.com/tmux-plugins/tmux-net-speed ~/clone/path

Add this line to the bottom of `.tmux.conf`:

    run-shell ~/clone/path/net_speed.tmux

Reload TMUX environment (type this in terminal)

    $ tmux source-file ~/.tmux.conf

If format strings are added to `status-right`, they should now be visible.


### Storage of Past Values
This plugin stores the total output for all the interfaces in a file in `/tmp/`. Therefore, the current user must be able to write and read from that directory.


### TODO
- Add unit tests
- Add error handling
- Configure which interfaces to calculate
- Configure format string for `#{net_speed}`
- Handle other OSs (currently only supports Linux)

### License

[MIT](LICENSE)
